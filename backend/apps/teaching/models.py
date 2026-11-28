"""Teacher workspace — attendance, materials, homework, quizzes, messaging, etc."""

from django.conf import settings
from django.db import models

from apps.academic.models import AcademicYear, StaffProfile, StudentProfile, Subject
from apps.core.models import TimeStampedModel, UUIDModel


class GradeScheme(UUIDModel, TimeStampedModel):
    """Editable weights / max scores per subject (item 4)."""

    subject = models.OneToOneField(Subject, on_delete=models.CASCADE, related_name="grade_scheme")
    teacher = models.ForeignKey(
        StaffProfile, on_delete=models.CASCADE, related_name="grade_schemes"
    )
    interro_weight = models.DecimalField(max_digits=4, decimal_places=2, default=1)
    devoir_weight = models.DecimalField(max_digits=4, decimal_places=2, default=1.5)
    tp_weight = models.DecimalField(max_digits=4, decimal_places=2, default=1)
    exam_weight = models.DecimalField(max_digits=4, decimal_places=2, default=2)
    cc_weight = models.DecimalField(max_digits=4, decimal_places=2, default=1)
    max_score_default = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    interro_count = models.PositiveSmallIntegerField(default=1)
    devoir_count = models.PositiveSmallIntegerField(default=1)
    notes = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"Scheme {self.subject}"


class AttendanceSession(UUIDModel, TimeStampedModel):
    """Class session for roll-call (item 7)."""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="attendance_sessions")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="attendance_sessions")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name="attendance_sessions")
    session_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    room = models.CharField(max_length=64, blank=True)
    topic = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-session_date", "-created_at"]

    def __str__(self) -> str:
        return f"{self.subject} · {self.session_date}"


class AttendanceRecord(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        PRESENT = "present", "Présent"
        ABSENT = "absent", "Absent"
        LATE = "late", "Retard"
        EXCUSED = "excused", "Excusé"

    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name="records")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="attendance_records")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PRESENT)
    comment = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("session", "student")


class ScheduleSlot(UUIDModel, TimeStampedModel):
    """Teacher timetable (item 8)."""

    class Weekday(models.IntegerChoices):
        MON = 0, "Lundi"
        TUE = 1, "Mardi"
        WED = 2, "Mercredi"
        THU = 3, "Jeudi"
        FRI = 4, "Vendredi"
        SAT = 5, "Samedi"
        SUN = 6, "Dimanche"

    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="schedule_slots")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="schedule_slots")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name="schedule_slots")
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=64, blank=True)
    jitsi_room = models.CharField(max_length=128, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["weekday", "start_time"]


class CourseMaterial(UUIDModel, TimeStampedModel):
    """Course files / links (item 9)."""

    class Kind(models.TextChoices):
        PDF = "pdf", "PDF"
        SLIDES = "slides", "Slides"
        VIDEO = "video", "Vidéo"
        LINK = "link", "Lien"
        OTHER = "other", "Autre"

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="materials")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="materials")
    title = models.CharField(max_length=255)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.PDF)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    is_published = models.BooleanField(default=True)


class HomeworkAssignment(UUIDModel, TimeStampedModel):
    """Online homework with deadline (item 10)."""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="homeworks")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="homeworks")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name="homeworks")
    title = models.CharField(max_length=255)
    instructions = models.TextField(blank=True)
    due_at = models.DateTimeField()
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    allow_late = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)


class HomeworkSubmission(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        SUBMITTED = "submitted", "Remis"
        GRADED = "graded", "Noté"
        LATE = "late", "En retard"

    homework = models.ForeignKey(HomeworkAssignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="homework_submissions")
    content = models.TextField(blank=True)
    file_url = models.URLField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SUBMITTED)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("homework", "student")


class ClassAnnouncement(UUIDModel, TimeStampedModel):
    """Class messaging / announcements (item 11)."""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="announcements")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="announcements")
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_pinned = models.BooleanField(default=False)
    notify_students = models.BooleanField(default=True)


class Quiz(UUIDModel, TimeStampedModel):
    """Auto-graded QCM (item 12)."""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="quizzes")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="quizzes")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=20)
    is_published = models.BooleanField(default=False)
    shuffle_questions = models.BooleanField(default=True)
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=10)


class QuizQuestion(UUIDModel, TimeStampedModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    prompt = models.TextField()
    choices = models.JSONField(default=list)  # [{"id":"a","text":"..."}, ...]
    correct_choice_id = models.CharField(max_length=32)
    points = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "created_at"]


class QuizAttempt(UUIDModel, TimeStampedModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="quiz_attempts")
    answers = models.JSONField(default=dict)  # {question_id: choice_id}
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("quiz", "student")


class VideoMeeting(UUIDModel, TimeStampedModel):
    """Jitsi room linked to a course (item 13)."""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="meetings")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="meetings")
    title = models.CharField(max_length=255)
    room_name = models.CharField(max_length=128)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    @property
    def jitsi_url(self) -> str:
        room = self.room_name.replace(" ", "-")
        return f"https://meet.jit.si/{room}"


class CatchUpRequest(UUIDModel, TimeStampedModel):
    """Session 2 / rattrapage (item 17)."""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvée"
        REJECTED = "rejected", "Refusée"
        DONE = "done", "Effectuée"

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="catchup_requests")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="catchup_requests")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="catchup_requests")
    reason = models.TextField()
    preferred_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    teacher_note = models.TextField(blank=True)
    session_label = models.CharField(max_length=64, default="Session 2")


class TeachingEvaluation(UUIDModel, TimeStampedModel):
    """Student feedback on teaching (item 19)."""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="evaluations")
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name="teaching_evaluations", null=True, blank=True
    )
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="evaluations_received")
    clarity = models.PositiveSmallIntegerField(default=3)  # 1-5
    usefulness = models.PositiveSmallIntegerField(default=3)
    pacing = models.PositiveSmallIntegerField(default=3)
    overall = models.PositiveSmallIntegerField(default=3)
    comment = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=True)


class GradeSheetSignature(UUIDModel, TimeStampedModel):
    """Digital signature of grade PV (item 16)."""

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="grade_signatures")
    teacher = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name="grade_signatures")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name="grade_signatures")
    title = models.CharField(max_length=255, default="PV de notes")
    payload_hash = models.CharField(max_length=128)
    signature_name = models.CharField(max_length=255)
    signed_at = models.DateTimeField(auto_now_add=True)
    snapshot = models.JSONField(default=dict)  # summary stats at sign time
    notes = models.TextField(blank=True)


# Re-export student extras so Django discovers them under app `teaching`
from apps.teaching.student_models import (  # noqa: E402,F401
    CareerOpportunity,
    Club,
    ClubMembership,
    ExamEvent,
    Internship,
    LibraryItem,
    ScholarshipOffer,
    StudentPayment,
)
from apps.teaching.ops_models import (  # noqa: E402,F401
    AuditEvent,
    CampusAnnouncement,
    MobilityPartner,
)
