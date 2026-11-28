from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import (
    AcademicYear,
    AdminRequest,
    Cohort,
    CourseUnit,
    Department,
    Enrollment,
    Faculty,
    Grade,
    Institution,
    Program,
    StaffProfile,
    StudentProfile,
    Subject,
    TeachingAssignment,
)
from apps.academic.serializers import (
    AcademicYearSerializer,
    AdminRequestSerializer,
    CohortSerializer,
    CourseUnitSerializer,
    DepartmentSerializer,
    EnrollmentSerializer,
    FacultySerializer,
    GradeSerializer,
    InstitutionSerializer,
    ProgramSerializer,
    StaffProfileSerializer,
    StudentProfileSerializer,
    SubjectSerializer,
    TeachingAssignmentSerializer,
)
from apps.core.pagination import EnrollmentPagination, StudentPagination
from apps.core.permissions import CanCreateAdminRequest, HasPermission, require_permission
from apps.notifications.models import Notification

STAFF_ROLES = (
    "admin",
    "super_admin",
    "academic_dir",
    "direction",
    "secretariat",
    "faculty_head",
    "dept_head",
)


def is_staff_user(user) -> bool:
    return bool(user and (user.is_superuser or user.has_any_role(*STAFF_ROLES)))


def is_teacher_only(user) -> bool:
    return bool(user and user.has_role("teacher") and not is_staff_user(user))


def is_student_only(user) -> bool:
    return bool(user and user.has_role("student") and not is_staff_user(user) and not user.has_role("teacher"))


class AcademicReadWriteMixin:
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [HasPermission()]
        return [IsAuthenticated()]


class InstitutionViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    required_permission = "academic.faculty.manage"
    search_fields = ("name", "code")


class FacultyViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Faculty.objects.select_related("institution").all()
    serializer_class = FacultySerializer
    required_permission = "academic.faculty.manage"
    filterset_fields = ("institution", "is_active")
    search_fields = ("name", "code")


class DepartmentViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Department.objects.select_related("faculty").all()
    serializer_class = DepartmentSerializer
    required_permission = "academic.faculty.manage"
    filterset_fields = ("faculty",)


class ProgramViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Program.objects.select_related("faculty", "department").all()
    serializer_class = ProgramSerializer
    required_permission = "academic.program.manage"
    filterset_fields = ("faculty", "degree_level", "is_active")
    search_fields = ("name", "code")


class AcademicYearViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    required_permission = "academic.program.manage"


class CohortViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Cohort.objects.select_related("program", "academic_year").all()
    serializer_class = CohortSerializer
    required_permission = "academic.program.manage"
    filterset_fields = ("program", "academic_year")


class CourseUnitViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = CourseUnit.objects.select_related("program").all()
    serializer_class = CourseUnitSerializer
    required_permission = "academic.program.manage"
    filterset_fields = ("program",)


class SubjectViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Subject.objects.select_related("course_unit", "course_unit__program").all()
    serializer_class = SubjectSerializer
    required_permission = "academic.program.manage"
    filterset_fields = ("course_unit",)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_student_only(user):
            program_ids = StudentProfile.objects.filter(user=user).values_list("program_id", flat=True)
            return qs.filter(course_unit__program_id__in=program_ids)
        if is_teacher_only(user):
            return qs.filter(assignments__teacher__user=user).distinct()
        return qs


class StaffProfileViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = StaffProfile.objects.select_related("user", "faculty", "department").all()
    serializer_class = StaffProfileSerializer
    search_fields = ("staff_number", "user__email", "user__first_name", "user__last_name")
    filterset_fields = ("staff_type", "faculty", "department")

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_staff_user(user):
            return qs
        if is_teacher_only(user):
            return qs.filter(user=user)
        return qs.none()


class StudentProfileViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = StudentProfile.objects.select_related("user", "program", "cohort").all()
    serializer_class = StudentProfileSerializer
    pagination_class = StudentPagination
    search_fields = ("student_number", "user__email", "user__first_name", "user__last_name")
    filterset_fields = ("status", "program", "cohort", "level")
    ordering_fields = ("student_number", "created_at")

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_student_only(user):
            return qs.filter(user=user)
        if is_teacher_only(user):
            assignments = TeachingAssignment.objects.filter(teacher__user=user)
            program_ids = list(
                assignments.values_list("subject__course_unit__program_id", flat=True)
            )
            enrolled_ids = Enrollment.objects.filter(
                program_id__in=program_ids, status="active"
            ).values_list("student_id", flat=True)
            return qs.filter(
                Q(program_id__in=program_ids) | Q(id__in=enrolled_ids)
            ).distinct()
        if is_staff_user(user):
            return qs
        return qs.none()


class EnrollmentViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related("student", "program", "cohort", "academic_year").all()
    serializer_class = EnrollmentSerializer
    required_permission = "academic.enrollment.manage"
    pagination_class = EnrollmentPagination
    filterset_fields = ("program", "cohort", "academic_year", "status")
    ordering_fields = ("created_at", "enrolled_at")

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_student_only(user):
            return qs.filter(student__user=user)
        if is_teacher_only(user):
            program_ids = TeachingAssignment.objects.filter(teacher__user=user).values_list(
                "subject__course_unit__program_id", flat=True
            )
            return qs.filter(program_id__in=program_ids)
        return qs

    def perform_create(self, serializer):
        enrollment = serializer.save()
        student = enrollment.student
        updates = []
        if enrollment.program_id and student.program_id != enrollment.program_id:
            student.program_id = enrollment.program_id
            updates.append("program_id")
        if enrollment.cohort_id and student.cohort_id != enrollment.cohort_id:
            student.cohort_id = enrollment.cohort_id
            updates.append("cohort_id")
        if updates:
            student.save(update_fields=[*updates, "updated_at"])

    def perform_update(self, serializer):
        enrollment = serializer.save()
        student = enrollment.student
        updates = []
        if enrollment.program_id and not student.program_id:
            student.program_id = enrollment.program_id
            updates.append("program_id")
        if enrollment.cohort_id and not student.cohort_id:
            student.cohort_id = enrollment.cohort_id
            updates.append("cohort_id")
        if updates:
            student.save(update_fields=[*updates, "updated_at"])


class TeachingAssignmentViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = TeachingAssignment.objects.select_related(
        "teacher__user",
        "subject__course_unit__program",
        "academic_year",
        "cohort",
    ).all()
    serializer_class = TeachingAssignmentSerializer
    required_permission = "academic.teaching.manage"

    def get_permissions(self):
        # Direction may consult courses/assignments but not modify them.
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [HasPermission()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_teacher_only(user):
            return qs.filter(teacher__user=user)
        return qs


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    filterset_fields = ("student", "subject", "academic_year", "kind", "is_published")
    search_fields = ("label", "student__student_number", "student__user__email")
    ordering_fields = ("created_at", "score")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [require_permission("academic.grades.manage")()]
        return [require_permission("academic.grades.read")()]

    def get_queryset(self):
        qs = Grade.objects.select_related(
            "student__user", "subject", "academic_year", "recorded_by"
        ).all()
        user = self.request.user
        if is_student_only(user):
            return qs.filter(student__user=user, is_published=True)
        if is_teacher_only(user):
            return qs.filter(subject__assignments__teacher__user=user).distinct()
        return qs

    def _assert_teacher_can_grade(self, user, subject, student=None):
        if not is_teacher_only(user):
            return
        assigned = TeachingAssignment.objects.filter(
            teacher__user=user, subject=subject
        ).exists()
        if not assigned:
            raise serializers.ValidationError(
                {"subject": "Vous n'êtes pas affecté à cette matière."}
            )
        if student is not None:
            program_id = subject.course_unit.program_id
            if student.program_id and student.program_id != program_id:
                raise serializers.ValidationError(
                    {"student": "Cet étudiant n'est pas dans le programme de la matière."}
                )

    def perform_create(self, serializer):
        user = self.request.user
        subject = serializer.validated_data["subject"]
        student = serializer.validated_data["student"]
        self._assert_teacher_can_grade(user, subject, student)
        grade = serializer.save(recorded_by=user)
        if grade.is_published:
            body = (
                f"Note publiée : {grade.score}/{grade.max_score}"
                if grade.score is not None
                else f"Statut : {grade.get_entry_status_display()}"
            )
            Notification.objects.create(
                recipient=grade.student.user,
                title=f"Nouvelle note — {grade.subject.name}",
                body=body,
                category="grades",
                data={"grade_id": str(grade.id)},
            )

    def perform_update(self, serializer):
        user = self.request.user
        grade = serializer.instance
        was_published = grade.is_published
        subject = serializer.validated_data.get("subject", grade.subject)
        student = serializer.validated_data.get("student", grade.student)
        self._assert_teacher_can_grade(user, subject, student)
        updated = serializer.save()
        if updated.is_published and not was_published:
            Notification.objects.create(
                recipient=updated.student.user,
                title=f"Note publiée — {updated.subject.name}",
                body=f"Note : {updated.score}/{updated.max_score}",
                category="grades",
                data={"grade_id": str(updated.id)},
            )


class AdminRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AdminRequestSerializer
    filterset_fields = ("status", "kind")
    search_fields = ("subject", "body", "requester__email")
    ordering_fields = ("created_at", "status")

    def get_permissions(self):
        if self.action == "create":
            return [CanCreateAdminRequest()]
        if self.action in ("update", "partial_update", "destroy"):
            return [require_permission("services.request.manage")()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = AdminRequest.objects.select_related("requester", "handled_by").all()
        user = self.request.user
        if user.has_perm_code("services.request.manage") or user.is_superuser:
            return qs
        return qs.filter(requester=user)

    def perform_create(self, serializer):
        from apps.identity.models import User

        req = serializer.save(requester=self.request.user)
        admins = User.objects.filter(
            is_active=True,
            user_roles__role__code__in=["admin", "secretariat", "super_admin", "direction"],
            user_roles__is_active=True,
        ).distinct()[:20]
        Notification.objects.bulk_create(
            [
                Notification(
                    recipient=admin,
                    title="Nouvelle demande administrative",
                    body=f"{req.requester.full_name} — {req.subject}",
                    category="admin_requests",
                    data={"request_id": str(req.id)},
                )
                for admin in admins
            ]
        )

    def perform_update(self, serializer):
        prev = self.get_object()
        req = serializer.save()
        if req.status != prev.status and req.status in {
            AdminRequest.Status.DONE,
            AdminRequest.Status.REJECTED,
            AdminRequest.Status.IN_PROGRESS,
        }:
            req.handled_by = self.request.user
            req.handled_at = timezone.now()
            req.save(update_fields=["handled_by", "handled_at", "updated_at"])
            Notification.objects.create(
                recipient=req.requester,
                title=f"Demande {req.get_status_display().lower()}",
                body=req.admin_note or req.subject,
                category="admin_requests",
                data={"request_id": str(req.id), "status": req.status},
            )
