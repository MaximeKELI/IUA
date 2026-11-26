from rest_framework import serializers

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
    StudentProfile,
    Subject,
    TeachingAssignment,
)


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = "__all__"


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = "__all__"


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = "__all__"


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"


class CohortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = "__all__"


class CourseUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseUnit
        fields = "__all__"


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"


class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            "id",
            "student_number",
            "program",
            "cohort",
            "level",
            "status",
            "email",
            "full_name",
            "created_at",
        )


class EnrollmentSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)
    program_code = serializers.CharField(source="program.code", read_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True)
    student_number = serializers.CharField(source="student.student_number", read_only=True)
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = Enrollment
        fields = "__all__"


class TeachingAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)

    class Meta:
        model = TeachingAssignment
        fields = "__all__"


class GradeSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    student_number = serializers.CharField(source="student.student_number", read_only=True)

    class Meta:
        model = Grade
        fields = (
            "id",
            "student",
            "subject",
            "academic_year",
            "kind",
            "label",
            "score",
            "max_score",
            "recorded_by",
            "is_published",
            "subject_name",
            "subject_code",
            "student_name",
            "student_number",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("recorded_by",)


class AdminRequestSerializer(serializers.ModelSerializer):
    requester_email = serializers.EmailField(source="requester.email", read_only=True)
    requester_name = serializers.CharField(source="requester.full_name", read_only=True)

    class Meta:
        model = AdminRequest
        fields = (
            "id",
            "requester",
            "requester_email",
            "requester_name",
            "kind",
            "subject",
            "body",
            "status",
            "admin_note",
            "handled_by",
            "handled_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("requester", "handled_by", "handled_at")
