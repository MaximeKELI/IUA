"""Admin provisioning: create users with roles and academic profiles."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from apps.academic.models import StaffProfile, StudentProfile
from apps.events.services import emit_event
from apps.identity.models import User
from apps.identity.services import assign_role


@transaction.atomic
def provision_user(
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    phone: str = "",
    roles: list[str],
    is_active: bool = True,
    student_number: str | None = None,
    program_id: str | None = None,
    cohort_id: str | None = None,
    level: str = "",
    staff_number: str | None = None,
    staff_type: str = StaffProfile.StaffType.ADMIN,
    title: str = "",
    user: User | None = None,
) -> User:
    email = email.lower().strip()
    created = False

    if user is None:
        user = User.objects.filter(email=email).first()
        if user is None:
            user = User(
                email=email,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                phone=phone.strip(),
                is_active=is_active,
                must_change_password=True,
            )
            user.set_password(password)
            user.save()
            created = True

    if not created:
        user.email = email
        user.first_name = first_name.strip()
        user.last_name = last_name.strip()
        user.phone = phone.strip()
        user.is_active = is_active
        if password:
            user.set_password(password)
            user.must_change_password = True
        user.save()

    user.user_roles.filter(is_active=True).update(is_active=False)
    for role_code in roles:
        assign_role(user, role_code)

    if "student" in roles:
        number = student_number or f"STU-{timezone.now().strftime('%y%m%d%H%M%S')}"
        profile, _ = StudentProfile.objects.update_or_create(
            user=user,
            defaults={
                "student_number": number,
                "program_id": program_id,
                "cohort_id": cohort_id,
                "level": level or "",
                "status": "active" if is_active else "inactive",
            },
        )
        # Auto-enroll when program is known (use provided cohort or current year cohort).
        if program_id:
            from apps.academic.models import AcademicYear, Cohort, Enrollment

            year = AcademicYear.objects.filter(is_current=True).order_by("-starts_on").first()
            cohort = None
            if cohort_id:
                cohort = Cohort.objects.filter(pk=cohort_id).first()
            if cohort is None and year:
                cohort = (
                    Cohort.objects.filter(program_id=program_id, academic_year=year)
                    .order_by("code")
                    .first()
                )
            if year and cohort:
                Enrollment.objects.get_or_create(
                    student=profile,
                    program_id=program_id,
                    academic_year=year,
                    defaults={"cohort": cohort, "status": "active"},
                )
                if not profile.cohort_id:
                    profile.cohort = cohort
                    profile.save(update_fields=["cohort", "updated_at"])

    staff_roles = {
        "teacher",
        "admin",
        "secretariat",
        "academic_dir",
        "direction",
        "super_admin",
        "faculty_head",
        "dept_head",
        "hr",
        "it",
        "finance_dir",
    }
    if staff_roles.intersection(roles):
        number = staff_number or f"STF-{timezone.now().strftime('%y%m%d%H%M%S')}"
        stype = (
            StaffProfile.StaffType.PERMANENT
            if "teacher" in roles
            else staff_type or StaffProfile.StaffType.ADMIN
        )
        StaffProfile.objects.update_or_create(
            user=user,
            defaults={
                "staff_number": number,
                "staff_type": stype,
                "title": title or "",
            },
        )

    emit_event(
        event_type="USER_PROVISIONED" if created else "USER_UPDATED",
        aggregate_type="User",
        aggregate_id=str(user.id),
        payload={"email": user.email, "roles": roles, "created": created},
        source="identity",
    )
    return user
