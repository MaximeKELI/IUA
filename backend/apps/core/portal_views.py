from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.models import Enrollment, Faculty, Program, StudentProfile, TeachingAssignment
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
            enrollments_count = Enrollment.objects.filter(student__user_id=request.user.id).count()
            unread = Notification.objects.filter(recipient_id=request.user.id, is_read=False).count()
            return {
                "role": "student",
                "profile": {
                    "student_number": getattr(profile, "student_number", None),
                    "program": getattr(getattr(profile, "program", None), "name", None),
                    "cohort": getattr(getattr(profile, "cohort", None), "name", None),
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
            assignments = list(
                TeachingAssignment.objects.filter(teacher__user_id=request.user.id)
                .select_related("subject")
                .only("subject_id", "subject__name", "subject__code")
            )
            unread = Notification.objects.filter(recipient_id=request.user.id, is_read=False).count()
            return {
                "role": "teacher",
                "assignments_count": len(assignments),
                "subjects": [
                    {"id": str(a.subject_id), "name": a.subject.name, "code": a.subject.code}
                    for a in assignments
                ],
                "unread_notifications": unread,
                "modules": [
                    {"code": "02", "name": "Portail enseignant", "status": "active"},
                    {"code": "07", "name": "Notes", "status": "active"},
                    {"code": "05", "name": "LMS", "status": "planned"},
                ],
            }

        payload = cached_value(cache_key("portal", "teacher", user_id), build, timeout=20)
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
            return {
                "role": "direction",
                "kpis": {
                    "students": StudentProfile.objects.count(),
                    "teachers": User.objects.filter(user_roles__role__code="teacher", user_roles__is_active=True)
                    .distinct()
                    .count(),
                    "faculties": Faculty.objects.count(),
                    "programs": Program.objects.count(),
                    "enrollments": Enrollment.objects.count(),
                },
                "students_by_faculty": [
                    {"faculty": row["program__faculty__name"] or "Non affecté", "total": row["total"]}
                    for row in by_faculty
                ],
                "note": "Indicateurs calculés depuis la base réelle (aucun chiffre fictif).",
            }

        payload = cached_value(cache_key("portal", "direction", "kpis"), build, timeout=30)
        return Response(payload)
