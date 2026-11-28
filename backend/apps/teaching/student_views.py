from datetime import timedelta

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import Grade, StudentProfile, Subject, TeachingAssignment
from apps.academic.views import is_student_only
from apps.notifications.models import Notification
from apps.teaching.models import (
    AttendanceRecord,
    ClassAnnouncement,
    CourseMaterial,
    HomeworkAssignment,
    HomeworkSubmission,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    ScheduleSlot,
    TeachingEvaluation,
    VideoMeeting,
)
from apps.teaching.serializers import (
    ClassAnnouncementSerializer,
    CourseMaterialSerializer,
    HomeworkAssignmentSerializer,
    HomeworkSubmissionSerializer,
    QuizAttemptSerializer,
    QuizSerializer,
    ScheduleSlotSerializer,
    TeachingEvaluationSerializer,
    VideoMeetingSerializer,
)
from apps.teaching.student_models import (
    CareerOpportunity,
    Club,
    ClubMembership,
    ExamEvent,
    Internship,
    LibraryItem,
    ScholarshipOffer,
    StudentPayment,
)


def student_profile(user):
    return StudentProfile.objects.filter(user=user).select_related("program").first()


def student_subject_ids(profile):
    if not profile or not profile.program_id:
        return []
    return list(Subject.objects.filter(course_unit__program_id=profile.program_id).values_list("id", flat=True))


class StudentPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentPayment
        fields = "__all__"
        read_only_fields = ("student",)


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = "__all__"
        read_only_fields = ("student",)


class ClubSerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    joined = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = "__all__"

    def get_members_count(self, obj):
        return obj.memberships.count()

    def get_joined(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        profile = student_profile(request.user)
        if not profile:
            return False
        return obj.memberships.filter(student=profile).exists()


class LibraryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryItem
        fields = "__all__"


class CareerOpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerOpportunity
        fields = "__all__"


class ScholarshipOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipOffer
        fields = "__all__"


class ExamEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamEvent
        fields = "__all__"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_hub(request):
    """Aggregated student extras for dashboard tiles."""
    profile = student_profile(request.user)
    if not profile:
        return Response({"detail": "Profil étudiant requis."}, status=400)
    sids = student_subject_ids(profile)
    now = timezone.now()

    payments = StudentPayment.objects.filter(student=profile)
    due = payments.filter(status__in=["due", "overdue", "partial"])
    grades = Grade.objects.filter(student=profile, is_published=True, entry_status="scored", score__isnull=False)
    avg = None
    ratios = []
    for g in grades:
        if g.max_score and float(g.max_score) > 0 and g.score is not None:
            ratios.append(float(g.score) / float(g.max_score) * 20)
    if ratios:
        avg = round(sum(ratios) / len(ratios), 2)

    subjects = Subject.objects.filter(id__in=sids).select_related("course_unit")
    ects_total = sum(float(s.course_unit.credits or 0) for s in subjects)
    # Rough earned ECTS: subjects with avg >= 10
    earned = 0.0
    for s in subjects:
        sub_grades = [g for g in grades if g.subject_id == s.id]
        if not sub_grades:
            continue
        r = []
        for g in sub_grades:
            if g.max_score and float(g.max_score) > 0 and g.score is not None:
                r.append(float(g.score) / float(g.max_score) * 20)
        if r and (sum(r) / len(r)) >= 10:
            earned += float(s.course_unit.credits or 0)

    absences = AttendanceRecord.objects.filter(student=profile, status__in=["absent", "late"]).count()
    open_hw = HomeworkAssignment.objects.filter(
        subject_id__in=sids, is_published=True, due_at__gte=now
    ).count()
    unread = Notification.objects.filter(recipient=request.user, is_read=False).count()

    return Response(
        {
            "avg_score": avg,
            "ects": {"earned": earned, "total": ects_total, "pct": round((earned / ects_total) * 100) if ects_total else 0},
            "finance": {
                "due_count": due.count(),
                "due_amount": due.aggregate(v=Sum("amount_xof"))["v"] or 0,
                "paid_count": payments.filter(status="paid").count(),
            },
            "absences": absences,
            "open_homeworks": open_hw,
            "unread_notifications": unread,
            "clubs_joined": ClubMembership.objects.filter(student=profile).count(),
            "upcoming_exams": ExamEvent.objects.filter(
                Q(student=profile) | Q(student__isnull=True, program_code=profile.program.code if profile.program else "")
            )
            .filter(starts_at__gte=now)
            .count(),
        }
    )


class StudentPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StudentPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        if not profile:
            return StudentPayment.objects.none()
        return StudentPayment.objects.filter(student=profile).order_by("status", "due_date")


class InternshipViewSet(viewsets.ModelViewSet):
    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        if not profile:
            return Internship.objects.none()
        return Internship.objects.filter(student=profile).order_by("-created_at")

    def perform_create(self, serializer):
        profile = student_profile(self.request.user)
        if not profile:
            raise serializers.ValidationError({"detail": "Profil étudiant requis."})
        serializer.save(student=profile)


class ClubViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticated]
    queryset = Club.objects.filter(is_active=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        profile = student_profile(request.user)
        if not profile:
            return Response({"detail": "Profil étudiant requis."}, status=400)
        club = self.get_object()
        ClubMembership.objects.get_or_create(club=club, student=profile)
        return Response({"joined": True})

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        profile = student_profile(request.user)
        if not profile:
            return Response({"detail": "Profil étudiant requis."}, status=400)
        ClubMembership.objects.filter(club=self.get_object(), student=profile).delete()
        return Response({"joined": False})


class LibraryItemViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LibraryItemSerializer
    permission_classes = [IsAuthenticated]
    queryset = LibraryItem.objects.all().order_by("title")
    search_fields = ("title", "author", "subject_tags")


class CareerOpportunityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CareerOpportunitySerializer
    permission_classes = [IsAuthenticated]
    queryset = CareerOpportunity.objects.filter(is_active=True).order_by("-created_at")


class ScholarshipOfferViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ScholarshipOfferSerializer
    permission_classes = [IsAuthenticated]
    queryset = ScholarshipOffer.objects.filter(is_active=True).order_by("deadline")


class ExamEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExamEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        if not profile:
            return ExamEvent.objects.none()
        code = profile.program.code if profile.program else ""
        return ExamEvent.objects.filter(
            Q(student=profile) | Q(student__isnull=True, program_code=code)
        ).order_by("starts_at")


class StudentMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        sids = student_subject_ids(profile)
        return CourseMaterial.objects.filter(subject_id__in=sids, is_published=True).select_related("subject")


class StudentHomeworkViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HomeworkAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        sids = student_subject_ids(profile)
        return HomeworkAssignment.objects.filter(subject_id__in=sids, is_published=True).select_related("subject")

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        profile = student_profile(request.user)
        if not profile:
            return Response({"detail": "Profil étudiant requis."}, status=400)
        hw = self.get_object()
        late = timezone.now() > hw.due_at
        if late and not hw.allow_late:
            return Response({"detail": "Deadline dépassée."}, status=400)
        sub, _ = HomeworkSubmission.objects.update_or_create(
            homework=hw,
            student=profile,
            defaults={
                "content": request.data.get("content", ""),
                "file_url": request.data.get("file_url", ""),
                "status": "late" if late else "submitted",
                "submitted_at": timezone.now(),
            },
        )
        return Response(HomeworkSubmissionSerializer(sub).data)


class StudentAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ClassAnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        sids = student_subject_ids(profile)
        return ClassAnnouncement.objects.filter(subject_id__in=sids).select_related("subject").order_by(
            "-is_pinned", "-created_at"
        )


class StudentMeetingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VideoMeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        sids = student_subject_ids(profile)
        return VideoMeeting.objects.filter(subject_id__in=sids, is_active=True).select_related("subject")


class StudentScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ScheduleSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        sids = student_subject_ids(profile)
        return ScheduleSlot.objects.filter(subject_id__in=sids, is_active=True).select_related("subject")


class StudentAttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        profile = student_profile(request.user)
        if not profile:
            return Response([])
        rows = (
            AttendanceRecord.objects.filter(student=profile)
            .select_related("session__subject")
            .order_by("-session__session_date")[:100]
        )
        return Response(
            [
                {
                    "id": str(r.id),
                    "date": r.session.session_date.isoformat(),
                    "subject": r.session.subject.name,
                    "status": r.status,
                    "comment": r.comment,
                    "topic": r.session.topic,
                }
                for r in rows
            ]
        )


class StudentQuizViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = student_profile(self.request.user)
        sids = student_subject_ids(profile)
        return (
            Quiz.objects.filter(subject_id__in=sids, is_published=True)
            .prefetch_related("questions")
            .select_related("subject")
        )

    @action(detail=True, methods=["post"])
    def attempt(self, request, pk=None):
        profile = student_profile(request.user)
        if not profile:
            return Response({"detail": "Profil étudiant requis."}, status=400)
        quiz = self.get_object()
        answers = request.data.get("answers", {})
        score = 0
        max_score = 0
        for q in quiz.questions.all():
            max_score += float(q.points)
            if str(answers.get(str(q.id)) or answers.get(q.id)) == q.correct_choice_id:
                score += float(q.points)
        attempt, _ = QuizAttempt.objects.update_or_create(
            quiz=quiz,
            student=profile,
            defaults={
                "answers": answers,
                "score": score,
                "max_score": max_score,
                "submitted_at": timezone.now(),
            },
        )
        return Response(QuizAttemptSerializer(attempt).data)


class StudentTeacherContactViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        profile = student_profile(request.user)
        sids = student_subject_ids(profile)
        rows = []
        for ta in TeachingAssignment.objects.filter(subject_id__in=sids).select_related(
            "teacher__user", "subject"
        ):
            rows.append(
                {
                    "subject": ta.subject.name,
                    "subject_id": str(ta.subject_id),
                    "teacher": ta.teacher.user.full_name,
                    "teacher_id": str(ta.teacher_id),
                    "email": ta.teacher.user.email,
                }
            )
        return Response(rows)

    def create(self, request):
        """Send a message to teacher via in-app notification."""
        profile = student_profile(request.user)
        if not profile:
            return Response({"detail": "Profil étudiant requis."}, status=400)
        subject_id = request.data.get("subject")
        body = request.data.get("body", "").strip()
        if not subject_id or not body:
            return Response({"detail": "subject et body requis."}, status=400)
        ta = TeachingAssignment.objects.filter(subject_id=subject_id).select_related("teacher__user").first()
        if not ta:
            return Response({"detail": "Enseignant introuvable."}, status=404)
        Notification.objects.create(
            recipient=ta.teacher.user,
            title=f"Message étudiant — {profile.user.full_name}",
            body=body,
            category="messaging",
            data={"student_id": str(profile.id), "subject_id": str(subject_id)},
        )
        return Response({"sent": True}, status=201)
