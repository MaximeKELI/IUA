from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.models import Enrollment, Faculty, Program, StudentProfile, TeachingAssignment
from apps.identity.models import User
from apps.notifications.models import Notification


class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.has_role("student") and not request.user.is_superuser:
            return Response({"code": "forbidden", "message": "Accès réservé aux étudiants."}, status=403)

        profile = StudentProfile.objects.filter(user=request.user).select_related("program", "cohort").first()
        enrollments = Enrollment.objects.filter(student__user=request.user).select_related("program", "cohort")
        unread = Notification.objects.filter(recipient=request.user, is_read=False).count()

        return Response(
            {
                "role": "student",
                "profile": {
                    "student_number": getattr(profile, "student_number", None),
                    "program": getattr(getattr(profile, "program", None), "name", None),
                    "cohort": getattr(getattr(profile, "cohort", None), "name", None),
                    "level": getattr(profile, "level", None),
                },
                "enrollments_count": enrollments.count(),
                "unread_notifications": unread,
                "modules": [
                    {"code": "01", "name": "Portail étudiant", "status": "active"},
                    {"code": "04", "name": "Finance", "status": "planned"},
                    {"code": "05", "name": "LMS", "status": "planned"},
                    {"code": "07", "name": "Notes", "status": "planned"},
                    {"code": "08", "name": "Documents", "status": "planned"},
                ],
            }
        )


class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.has_role("teacher") and not request.user.is_superuser:
            return Response({"code": "forbidden", "message": "Accès réservé aux enseignants."}, status=403)

        assignments = TeachingAssignment.objects.filter(teacher__user=request.user).select_related("subject")
        unread = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response(
            {
                "role": "teacher",
                "assignments_count": assignments.count(),
                "subjects": [
                    {"id": str(a.subject_id), "name": a.subject.name, "code": a.subject.code}
                    for a in assignments
                ],
                "unread_notifications": unread,
                "modules": [
                    {"code": "02", "name": "Portail enseignant", "status": "active"},
                    {"code": "05", "name": "LMS", "status": "planned"},
                    {"code": "07", "name": "Notes", "status": "planned"},
                ],
            }
        )


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.has_any_role("admin", "super_admin", "academic_dir", "direction")
            or request.user.is_superuser
        ):
            return Response({"code": "forbidden", "message": "Accès réservé à l'administration."}, status=403)

        return Response(
            {
                "role": "admin",
                "stats": {
                    "users": User.objects.filter(is_active=True).count(),
                    "students": StudentProfile.objects.count(),
                    "faculties": Faculty.objects.count(),
                    "programs": Program.objects.count(),
                    "enrollments": Enrollment.objects.count(),
                },
            }
        )


class DirectionDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.has_any_role("direction", "super_admin", "academic_dir", "finance_dir")
            or request.user.is_superuser
        ):
            return Response({"code": "forbidden", "message": "Accès réservé à la direction."}, status=403)

        by_faculty = (
            StudentProfile.objects.values("program__faculty__name")
            .annotate(total=Count("id"))
            .order_by("-total")
        )
        return Response(
            {
                "role": "direction",
                "kpis": {
                    "students": StudentProfile.objects.count(),
                    "teachers": User.objects.filter(user_roles__role__code="teacher").distinct().count(),
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
        )
