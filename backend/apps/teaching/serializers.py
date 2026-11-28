from rest_framework import serializers

from apps.teaching.models import (
    AttendanceRecord,
    AttendanceSession,
    CatchUpRequest,
    ClassAnnouncement,
    CourseMaterial,
    GradeScheme,
    GradeSheetSignature,
    HomeworkAssignment,
    HomeworkSubmission,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    ScheduleSlot,
    TeachingEvaluation,
    VideoMeeting,
)


class GradeSchemeSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = GradeScheme
        fields = "__all__"
        read_only_fields = ("teacher",)


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    student_number = serializers.CharField(source="student.student_number", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = "__all__"


class AttendanceSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)
    present_count = serializers.SerializerMethodField()
    absent_count = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = "__all__"
        read_only_fields = ("teacher",)

    def get_present_count(self, obj):
        annotated = getattr(obj, "present_count", None)
        if annotated is not None:
            return annotated
        return obj.records.filter(status__in=["present", "late"]).count()

    def get_absent_count(self, obj):
        annotated = getattr(obj, "absent_count", None)
        if annotated is not None:
            return annotated
        return obj.records.filter(status="absent").count()


class ScheduleSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    weekday_label = serializers.CharField(source="get_weekday_display", read_only=True)

    class Meta:
        model = ScheduleSlot
        fields = "__all__"
        read_only_fields = ("teacher",)


class CourseMaterialSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = CourseMaterial
        fields = "__all__"
        read_only_fields = ("teacher",)


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = HomeworkSubmission
        fields = "__all__"


class HomeworkAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = HomeworkAssignment
        fields = "__all__"
        read_only_fields = ("teacher",)

    def get_submissions_count(self, obj):
        return obj.submissions.count()


class ClassAnnouncementSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = ClassAnnouncement
        fields = "__all__"
        read_only_fields = ("teacher",)


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = "__all__"


class QuizSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    questions = QuizQuestionSerializer(many=True, read_only=True)
    attempts_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = "__all__"
        read_only_fields = ("teacher",)

    def get_attempts_count(self, obj):
        return obj.attempts.count()


class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = QuizAttempt
        fields = "__all__"


class VideoMeetingSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    jitsi_url = serializers.CharField(read_only=True)

    class Meta:
        model = VideoMeeting
        fields = "__all__"
        read_only_fields = ("teacher",)


class CatchUpRequestSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = CatchUpRequest
        fields = "__all__"
        read_only_fields = ("teacher",)


class TeachingEvaluationSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = TeachingEvaluation
        fields = "__all__"


class GradeSheetSignatureSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = GradeSheetSignature
        fields = "__all__"
        read_only_fields = ("teacher", "payload_hash", "signed_at")
