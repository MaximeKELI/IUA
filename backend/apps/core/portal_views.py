from django.db.models import Avg, Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.models import (
    AdminRequest,
    Enrollment,
    Faculty,
    Grade,
    Program,
    StaffProfile,
    StudentProfile,
    TeachingAssignment,
)
from apps.core.cache import cache_key, cached_value
from apps.identity.models import User
from apps.notifications.models import Notification


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.has_role("student") and not request.user.is_superuser:
            return Response({"code": "forbidden", "message": "Accès réservé aux étudiants."}, status=403)

        user_id = str(request.user.id)

        def build():
            profile = (
                StudentProfile.objects.filter(user_id=request.user.id)
                .select_related("program", "cohort")
                .only(
                    "student_number",
                    "level",
                    "program__name",
                    "cohort__name",
                )
                .first()
            )
            enrollments = (
                Enrollment.objects.filter(student__user_id=request.user.id, status="active")
                .select_related("program", "cohort")
                .order_by("-created_at")
            )
            enrollments_count = enrollments.count()
            latest = enrollments.first()
            program_name = getattr(getattr(profile, "program", None), "name", None)
            cohort_name = getattr(getattr(profile, "cohort", None), "name", None)
            if not program_name and latest:
                program_name = latest.program.name
            if not cohort_name and latest:
                cohort_name = latest.cohort.name
            # Heal profile drift from enrollment
            if profile and latest:
                dirty = []
                if not profile.program_id and latest.program_id:
                    profile.program_id = latest.program_id
                    dirty.append("program_id")
                if not profile.cohort_id and latest.cohort_id:
                    profile.cohort_id = latest.cohort_id
                    dirty.append("cohort_id")
                if dirty:
                    profile.save(update_fields=[*dirty, "updated_at"])
            unread = Notification.objects.filter(recipient_id=request.user.id, is_read=False).count()
            return {
                "role": "student",
                "profile": {
                    "student_number": getattr(profile, "student_number", None),
                    "program": program_name,
                    "cohort": cohort_name,
                    "level": getattr(profile, "level", None),
                },
                "enrollments_count": enrollments_count,
                "unread_notifications": unread,
                "modules": [
                    {"code": "01", "name": "Portail étudiant", "status": "active"},
                    {"code": "07", "name": "Notes", "status": "active"},
                    {"code": "08", "name": "Demandes admin.", "status": "active"},
                    {"code": "04", "name": "Finance", "status": "planned"},
                    {"code": "05", "name": "LMS", "status": "planned"},
                ],
            }

        payload = cached_value(cache_key("portal", "student", user_id), build, timeout=20)
        return Response(payload)


class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.has_role("teacher") and not request.user.is_superuser:
            return Response({"code": "forbidden", "message": "Accès réservé aux enseignants."}, status=403)

        user_id = str(request.user.id)

        def build():
            assignments_qs = (
                TeachingAssignment.objects.filter(teacher__user_id=request.user.id)
                .select_related(
                    "subject__course_unit__program",
                    "academic_year",
                    "cohort",
                    "teacher__faculty",
                    "teacher__department",
                )
            )
            assignments = list(assignments_qs)
            subject_ids = [a.subject_id for a in assignments]
            program_ids = [
                a.subject.course_unit.program_id
                for a in assignments
                if a.subject.course_unit_id
            ]
            grades_qs = Grade.objects.filter(
                recorded_by_id=request.user.id
            ) | Grade.objects.filter(subject_id__in=subject_ids)
            grades_qs = grades_qs.distinct()

            students_by_program: dict[str, int] = {}
            if program_ids:
                for row in (
                    StudentProfile.objects.filter(program_id__in=program_ids)
                    .values("program_id")
                    .annotate(c=Count("id"))
                ):
                    students_by_program[str(row["program_id"])] = row["c"]

            grade_stats_by_subject: dict[str, dict] = {}
            if subject_ids:
                for row in (
                    grades_qs.filter(subject_id__in=subject_ids)
                    .values("subject_id")
                    .annotate(
                        total=Count("id"),
                        drafts=Count("id", filter=Q(is_published=False)),
                        graded_students=Count("student_id", distinct=True),
                        avg_score=Avg("score"),
                    )
                ):
                    grade_stats_by_subject[str(row["subject_id"])] = row

            students_count = (
                StudentProfile.objects.filter(
                    Q(program_id__in=program_ids)
                    | Q(
                        id__in=Enrollment.objects.filter(
                            program_id__in=program_ids, status="active"
                        ).values_list("student_id", flat=True)
                    )
                )
                .distinct()
                .count()
                if program_ids
                else 0
            )
            recent = list(
                grades_qs.select_related("student__user", "subject")
                .order_by("-created_at")[:8]
                .values(
                    "id",
                    "score",
                    "max_score",
                    "label",
                    "kind",
                    "is_published",
                    "subject__name",
                    "student__user__first_name",
                    "student__user__last_name",
                    "created_at",
                )
            )
            staff = (
                StaffProfile.objects.filter(user_id=request.user.id)
                .select_related("faculty", "department")
                .first()
            )
            unread = Notification.objects.filter(
                recipient_id=request.user.id, is_read=False
            ).count()

            subjects = []
            for a in assignments:
                program_id = (
                    str(a.subject.course_unit.program_id)
                    if a.subject.course_unit_id
                    else None
                )
                stats = grade_stats_by_subject.get(str(a.subject_id), {})
                cohort_students = students_by_program.get(program_id or "", 0)
                graded = stats.get("graded_students", 0) or 0
                subjects.append(
                    {
                        "id": str(a.subject_id),
                        "name": a.subject.name,
                        "code": a.subject.code,
                        "program": a.subject.course_unit.program.name
                        if a.subject.course_unit_id
                        else None,
                        "program_id": program_id,
                        "year": a.academic_year.name,
                        "cohort": a.cohort.name if a.cohort_id else None,
                        "hours": a.subject.hours,
                        "students_count": cohort_students,
                        "grades_count": stats.get("total", 0) or 0,
                        "drafts_count": stats.get("drafts", 0) or 0,
                        "graded_students": graded,
                        "coverage_pct": round((graded / cohort_students) * 100)
                        if cohort_students
                        else 0,
                        "avg_score": (
                            round(float(stats["avg_score"]), 2)
                            if stats.get("avg_score") is not None
                            else None
                        ),
                    }
                )

            return {
                "role": "teacher",
                "full_name": request.user.full_name,
                "title": getattr(staff, "title", "") or "",
                "profile": {
                    "staff_number": getattr(staff, "staff_number", None),
                    "staff_type": getattr(staff, "staff_type", None),
                    "title": getattr(staff, "title", "") or "",
                    "faculty": getattr(getattr(staff, "faculty", None), "name", None),
                    "department": getattr(
                        getattr(staff, "department", None), "name", None
                    ),
                },
                "assignments_count": len(assignments),
                "students_count": students_count,
                "grades_count": grades_qs.count(),
                "drafts_count": grades_qs.filter(is_published=False).count(),
                "unread_notifications": unread,
                "subjects": subjects,
                "recent_grades": [
                    {
                        "id": str(r["id"]),
                        "score": str(r["score"]),
                        "max_score": str(r["max_score"]),
                        "label": r["label"] or r["kind"],
                        "is_published": r["is_published"],
                        "subject": r["subject__name"],
                        "student": f"{r['student__user__first_name']} {r['student__user__last_name']}".strip(),
                        "created_at": r["created_at"].isoformat(),
                    }
                    for r in recent
                ],
            }

        payload = cached_value(cache_key("portal", "teacher", user_id), build, timeout=15)
        return Response(payload)


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.has_any_role(
                "admin", "super_admin", "academic_dir", "direction", "secretariat"
            )
            or request.user.is_superuser
        ):
            return Response({"code": "forbidden", "message": "Accès réservé à l'administration."}, status=403)

        def build():
            return {
                "role": "admin",
                "stats": {
                    "users": User.objects.filter(is_active=True).count(),
                    "students": StudentProfile.objects.count(),
                    "faculties": Faculty.objects.count(),
                    "programs": Program.objects.count(),
                    "enrollments": Enrollment.objects.count(),
                },
            }

        payload = cached_value(cache_key("portal", "admin", "stats"), build, timeout=30)
        return Response(payload)


class DirectionDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.has_any_role(
                "direction",
                "super_admin",
                "academic_dir",
                "finance_dir",
                "admin",
            )
            or request.user.is_superuser
        ):
            return Response({"code": "forbidden", "message": "Accès réservé à la direction."}, status=403)

        def build():
            by_faculty = list(
                StudentProfile.objects.values("program__faculty__name")
                .annotate(total=Count("id"))
                .order_by("-total")[:50]
            )
            pending_requests = AdminRequest.objects.filter(status="pending").count()
            recent_requests = list(
                AdminRequest.objects.select_related("requester")
                .order_by("-created_at")[:8]
                .values("id", "subject", "status", "kind", "requester__first_name", "requester__last_name")
            )
            return {
                "role": "direction",
                "kpis": {
                    "students": StudentProfile.objects.count(),
                    "teachers": User.objects.filter(
                        user_roles__role__code="teacher", user_roles__is_active=True
                    )
                    .distinct()
                    .count(),
                    "faculties": Faculty.objects.count(),
                    "programs": Program.objects.count(),
                    "enrollments": Enrollment.objects.count(),
                    "pending_requests": pending_requests,
                    "grades_published": Grade.objects.filter(is_published=True).count(),
                    "teaching_assignments": TeachingAssignment.objects.count(),
                },
                "students_by_faculty": [
                    {
                        "faculty": row["program__faculty__name"] or "Non affecté",
                        "total": row["total"],
                    }
                    for row in by_faculty
                ],
                "recent_requests": [
                    {
                        "id": str(r["id"]),
                        "subject": r["subject"],
                        "status": r["status"],
                        "kind": r["kind"],
                        "requester": f"{r['requester__first_name']} {r['requester__last_name']}".strip(),
                    }
                    for r in recent_requests
                ],
                "capabilities": {
                    "can_manage_users": True,
                    "can_manage_programs": True,
                    "can_manage_enrollments": True,
                    "can_manage_requests": True,
                    "can_view_grades": True,
                    "can_edit_grades": False,
                    "can_view_teaching": True,
                    "can_edit_teaching": False,
                    "can_see_student_ids": False,
                },
                "note": "Vous gérez l’établissement. Notes et cours : consultation. Matricules étudiants masqués.",
            }

        payload = cached_value(cache_key("portal", "direction", "kpis"), build, timeout=15)
        return Response(payload)
