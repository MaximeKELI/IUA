from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.events.services import emit_event
from apps.identity.models import LoginAttempt, Role, User, UserRole


MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def record_login_attempt(email: str, request, successful: bool) -> None:
    LoginAttempt.objects.create(
        email=email.lower(),
        ip_address=client_ip(request),
        successful=successful,
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
    )


def is_login_locked(email: str) -> bool:
    since = timezone.now() - timedelta(minutes=LOCKOUT_MINUTES)
    recent_failures = LoginAttempt.objects.filter(
        email=email.lower(),
        successful=False,
        created_at__gte=since,
    ).count()
    return recent_failures >= MAX_FAILED_ATTEMPTS


@transaction.atomic
def assign_role(user: User, role_code: str, *, faculty_id=None, program_id=None) -> UserRole:
    role = Role.objects.get(code=role_code)
    user_role, created = UserRole.objects.get_or_create(
        user=user,
        role=role,
        faculty_id=faculty_id,
        program_id=program_id,
        defaults={"is_active": True},
    )
    if not created and not user_role.is_active:
        user_role.is_active = True
        user_role.save(update_fields=["is_active", "updated_at"])

    emit_event(
        event_type="USER_ROLE_ASSIGNED",
        aggregate_type="User",
        aggregate_id=str(user.id),
        payload={"role": role_code, "user_email": user.email},
        source="identity",
    )
    return user_role
