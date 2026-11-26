from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.academic.models import (
    AcademicYear,
    Cohort,
    CourseUnit,
    Department,
    Enrollment,
    Faculty,
    Institution,
    Program,
    StudentProfile,
    Subject,
    TeachingAssignment,
)
from apps.academic.serializers import (
    AcademicYearSerializer,
    CohortSerializer,
    CourseUnitSerializer,
    DepartmentSerializer,
    EnrollmentSerializer,
    FacultySerializer,
    InstitutionSerializer,
    ProgramSerializer,
    StudentProfileSerializer,
    SubjectSerializer,
    TeachingAssignmentSerializer,
)
from apps.core.permissions import HasPermission


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
    queryset = Subject.objects.select_related("course_unit").all()
    serializer_class = SubjectSerializer
    required_permission = "academic.program.manage"


class StudentProfileViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = StudentProfile.objects.select_related("user", "program", "cohort").all()
    serializer_class = StudentProfileSerializer
    search_fields = ("student_number", "user__email", "user__first_name", "user__last_name")

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.has_any_role("student") and not user.has_any_role(
            "admin", "super_admin", "academic_dir", "direction", "teacher"
        ):
            return qs.filter(user=user)
        return qs


class EnrollmentViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related("student", "program", "cohort", "academic_year").all()
    serializer_class = EnrollmentSerializer
    required_permission = "academic.enrollment.manage"
    filterset_fields = ("program", "cohort", "academic_year", "status")


class TeachingAssignmentViewSet(AcademicReadWriteMixin, viewsets.ModelViewSet):
    queryset = TeachingAssignment.objects.select_related("teacher", "subject", "academic_year").all()
    serializer_class = TeachingAssignmentSerializer
    required_permission = "academic.program.manage"
