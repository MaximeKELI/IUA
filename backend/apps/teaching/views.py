import hashlib
import json
from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import Grade, StaffProfile, StudentProfile, Subject, TeachingAssignment
from apps.academic.views import is_teacher_only
from apps.core.permissions import require_permission
from apps.notifications.models import Notification
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
from apps.teaching.serializers import (
    AttendanceRecordSerializer,
    AttendanceSessionSerializer,
    CatchUpRequestSerializer,
    ClassAnnouncementSerializer,
    CourseMaterialSerializer,
    GradeSchemeSerializer,
    GradeSheetSignatureSerializer,
    HomeworkAssignmentSerializer,
    HomeworkSubmissionSerializer,
    QuizAttemptSerializer,
    QuizQuestionSerializer,
    QuizSerializer,
    ScheduleSlotSerializer,
    TeachingEvaluationSerializer,
    VideoMeetingSerializer,
)


def teacher_profile(user):
    return StaffProfile.objects.filter(user=user).first()


def assert_teacher_subject(user, subject_id):
    if not is_teacher_only(user) and not user.is_superuser:
        if user.has_any_role("admin", "super_admin", "academic_dir", "secretariat"):
            return
    if user.is_superuser or user.has_any_role("admin", "super_admin", "academic_dir"):
        return
    ok = TeachingAssignment.objects.filter(teacher__user=user, subject_id=subject_id).exists()
    if not ok:
        raise serializers.ValidationError({"subject": "Matière non affectée."})


class TeacherScopedMixin:
    """Scope querysets to the connected teacher when applicable."""

    teacher_field = "teacher"

    def get_teacher(self):
        return teacher_profile(self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser or user.has_any_role(
            "admin",
            "super_admin",
            "academic_dir",
            "secretariat",
            "direction",
            "faculty_head",
            "dept_head",
        ):
            return qs
        staff = self.get_teacher()
        if not staff:
            return qs.none()
        return qs.filter(**{self.teacher_field: staff})

    def perform_create(self, serializer):
        staff = self.get_teacher()
        if not staff:
            raise serializers.ValidationError({"detail": "Profil enseignant requis."})
        subject = serializer.validated_data.get("subject")
        if subject:
            assert_teacher_subject(self.request.user, subject.id)
        serializer.save(**{self.teacher_field: staff})


class GradeSchemeViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = GradeSchemeSerializer
    queryset = GradeScheme.objects.select_related("subject", "teacher").all()
    filterset_fields = ("subject",)

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]


class AttendanceSessionViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = AttendanceSessionSerializer
    queryset = AttendanceSession.objects.select_related("subject", "teacher", "academic_year").prefetch_related(
        "records__student__user"
    )
    filterset_fields = ("subject", "academic_year", "session_date")

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]

    @action(detail=True, methods=["post"])
    def bulk_records(self, request, pk=None):
        session = self.get_object()
        items = request.data.get("records", [])
        saved = []
        for item in items:
            rec, _ = AttendanceRecord.objects.update_or_create(
                session=session,
                student_id=item["student"],
                defaults={
                    "status": item.get("status", "present"),
                    "comment": item.get("comment", ""),
                },
            )
            saved.append(rec)
        return Response(AttendanceRecordSerializer(saved, many=True).data)


class ScheduleSlotViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = ScheduleSlotSerializer
    queryset = ScheduleSlot.objects.select_related("subject", "teacher", "academic_year").all()
    filterset_fields = ("subject", "weekday", "is_active")

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]


class CourseMaterialViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = CourseMaterialSerializer
    queryset = CourseMaterial.objects.select_related("subject", "teacher").all()
    filterset_fields = ("subject", "kind", "is_published")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission("academic.grades.read")()]
        return [require_permission("academic.grades.manage")()]


class HomeworkAssignmentViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = HomeworkAssignmentSerializer
    queryset = HomeworkAssignment.objects.select_related("subject", "teacher", "academic_year").all()
    filterset_fields = ("subject", "is_published")

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]


class HomeworkSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkSubmissionSerializer
    queryset = HomeworkSubmission.objects.select_related("homework", "student__user").all()
    filterset_fields = ("homework", "student", "status")

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_teacher_only(user):
            return qs.filter(homework__teacher__user=user)
        return qs


class ClassAnnouncementViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = ClassAnnouncementSerializer
    queryset = ClassAnnouncement.objects.select_related("subject", "teacher").all()
    filterset_fields = ("subject", "is_pinned")

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]

    def perform_create(self, serializer):
        super().perform_create(serializer)
        ann = serializer.instance
        if not ann.notify_students:
            return
        students = StudentProfile.objects.filter(program=ann.subject.course_unit.program)
        Notification.objects.bulk_create(
            [
                Notification(
                    recipient=s.user,
                    title=f"Annonce — {ann.subject.name}",
                    body=ann.title,
                    category="teaching",
                    data={"announcement_id": str(ann.id)},
                )
                for s in students.select_related("user")[:500]
            ]
        )


class QuizViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    queryset = Quiz.objects.select_related("subject", "teacher").prefetch_related("questions").all()
    filterset_fields = ("subject", "is_published")

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]

    @action(detail=True, methods=["post"])
    def add_question(self, request, pk=None):
        quiz = self.get_object()
        ser = QuizQuestionSerializer(data={**request.data, "quiz": quiz.id})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        quiz = self.get_object()
        attempts = quiz.attempts.select_related("student__user")
        return Response(QuizAttemptSerializer(attempts, many=True).data)


class VideoMeetingViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = VideoMeetingSerializer
    queryset = VideoMeeting.objects.select_related("subject", "teacher").all()
    filterset_fields = ("subject", "is_active")

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]

    def perform_create(self, serializer):
        staff = self.get_teacher()
        subject = serializer.validated_data["subject"]
        room = serializer.validated_data.get("room_name") or f"IUA-{subject.code}-{staff.staff_number or staff.id.hex[:6]}"
        serializer.save(teacher=staff, room_name=room.replace(" ", "-"))


class CatchUpRequestViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = CatchUpRequestSerializer
    queryset = CatchUpRequest.objects.select_related("subject", "student__user", "teacher").all()
    filterset_fields = ("subject", "status", "student")

    ALLOWED_TRANSITIONS = {
        CatchUpRequest.Status.PENDING: {
            CatchUpRequest.Status.APPROVED,
            CatchUpRequest.Status.REJECTED,
        },
        CatchUpRequest.Status.APPROVED: {CatchUpRequest.Status.DONE},
        CatchUpRequest.Status.REJECTED: set(),
        CatchUpRequest.Status.DONE: set(),
    }

    def get_permissions(self):
        # Enseignant (grades.manage) crée / valide ; staff ops (request.manage) supervise.
        if self.action in ("list", "retrieve", "approve", "reject", "complete"):
            return [IsAuthenticated()]
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated()]
        return [require_permission("academic.grades.manage")()]

    def _can_oversee(self, user) -> bool:
        return (
            user.is_superuser
            or user.has_perm_code("academic.grades.manage")
            or user.has_perm_code("services.request.manage")
        )

    def list(self, request, *args, **kwargs):
        if not self._can_oversee(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not self._can_oversee(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)

    def _apply_status(self, obj: CatchUpRequest, new_status: str, note: str | None = None):
        from rest_framework.exceptions import ValidationError

        allowed = self.ALLOWED_TRANSITIONS.get(obj.status, set())
        if new_status != obj.status and new_status not in allowed:
            raise ValidationError(
                {
                    "status": (
                        f"Transition interdite : {obj.status} → {new_status}. "
                        f"Autorisées : {', '.join(sorted(allowed)) or 'aucune'}."
                    )
                }
            )
        obj.status = new_status
        if note is not None:
            obj.teacher_note = note
        obj.save()
        return obj

    def update(self, request, *args, **kwargs):
        if not self._can_oversee(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        new_status = request.data.get("status", instance.status)
        if new_status != instance.status:
            note = request.data.get("teacher_note")
            self._apply_status(instance, new_status, note)
            return Response(CatchUpRequestSerializer(instance).data)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if not self._can_oversee(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        obj = self._apply_status(
            self.get_object(),
            CatchUpRequest.Status.APPROVED,
            request.data.get("teacher_note"),
        )
        return Response(CatchUpRequestSerializer(obj).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if not self._can_oversee(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        obj = self._apply_status(
            self.get_object(),
            CatchUpRequest.Status.REJECTED,
            request.data.get("teacher_note"),
        )
        return Response(CatchUpRequestSerializer(obj).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        if not self._can_oversee(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        obj = self._apply_status(
            self.get_object(),
            CatchUpRequest.Status.DONE,
            request.data.get("teacher_note"),
        )
        return Response(CatchUpRequestSerializer(obj).data)


class TeachingEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = TeachingEvaluationSerializer
    queryset = TeachingEvaluation.objects.select_related("subject", "teacher", "student").all()
    filterset_fields = ("subject", "teacher")
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        return [require_permission("academic.grades.read")()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_teacher_only(user):
            return qs.filter(teacher__user=user)
        return qs

    def perform_create(self, serializer):
        student = StudentProfile.objects.filter(user=self.request.user).first()
        teacher = serializer.validated_data["teacher"]
        if serializer.validated_data.get("is_anonymous", True):
            serializer.save(student=None, teacher=teacher)
        else:
            serializer.save(student=student, teacher=teacher)


class GradeSheetSignatureViewSet(TeacherScopedMixin, viewsets.ModelViewSet):
    serializer_class = GradeSheetSignatureSerializer
    queryset = GradeSheetSignature.objects.select_related("subject", "teacher", "academic_year").all()
    filterset_fields = ("subject", "academic_year")
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        return [require_permission("academic.grades.manage")()]

    def perform_create(self, serializer):
        staff = self.get_teacher()
        subject = serializer.validated_data["subject"]
        year = serializer.validated_data["academic_year"]
        grades = list(
            Grade.objects.filter(subject=subject, academic_year=year).values(
                "student_id", "kind", "score", "max_score", "entry_status", "is_published"
            )
        )
        payload = json.dumps(grades, sort_keys=True, default=str)
        digest = hashlib.sha256(payload.encode()).hexdigest()
        avg = (
            Grade.objects.filter(subject=subject, academic_year=year, entry_status="scored", score__isnull=False)
            .aggregate(v=Avg("score"))
            .get("v")
        )
        serializer.save(
            teacher=staff,
            payload_hash=digest,
            signature_name=serializer.validated_data.get("signature_name") or staff.user.full_name,
            snapshot={
                "grades_count": len(grades),
                "avg_score": float(avg) if avg is not None else None,
                "signed_by": staff.user.full_name,
            },
        )


@api_view(["GET"])
@permission_classes([require_permission("academic.grades.manage")])
def teacher_insights(request):
    """Alerts, averages comparison, overdue grading (items 14, 15, 18 helpers)."""
    staff = teacher_profile(request.user)
    if not staff and not request.user.is_superuser:
        return Response({"detail": "Profil enseignant requis."}, status=400)

    assignments = TeachingAssignment.objects.filter(teacher=staff).select_related(
        "subject", "academic_year", "subject__course_unit__program"
    ) if staff else TeachingAssignment.objects.none()

    subject_ids = [a.subject_id for a in assignments]
    now = timezone.now()
    week_ago = now - timedelta(days=7)

    drafts = Grade.objects.filter(subject_id__in=subject_ids, is_published=False).count()
    recent_absences = AttendanceRecord.objects.filter(
        session__subject_id__in=subject_ids, status="absent", created_at__gte=week_ago
    ).count()
    open_catchups = CatchUpRequest.objects.filter(teacher=staff, status="pending").count() if staff else 0
    overdue_homeworks = HomeworkAssignment.objects.filter(
        teacher=staff, due_at__lt=now, is_published=True
    ).annotate(subs=Count("submissions")).filter(subs=0).count() if staff else 0

    by_subject = []
    for a in assignments:
        grades = Grade.objects.filter(subject=a.subject, entry_status="scored", score__isnull=False)
        avg = grades.aggregate(v=Avg("score"))["v"]
        students = StudentProfile.objects.filter(program=a.subject.course_unit.program).count()
        graded = grades.values("student_id").distinct().count()
        by_subject.append(
            {
                "subject_id": str(a.subject_id),
                "subject_name": a.subject.name,
                "year": a.academic_year.name,
                "avg_score": round(float(avg), 2) if avg is not None else None,
                "students": students,
                "graded_students": graded,
                "coverage_pct": round((graded / students) * 100) if students else 0,
                "drafts": Grade.objects.filter(subject=a.subject, is_published=False).count(),
            }
        )

    alerts = []
    if drafts:
        alerts.append({"level": "warning", "code": "drafts", "message": f"{drafts} note(s) en brouillon non publiée(s)."})
    if recent_absences:
        alerts.append({"level": "info", "code": "absences", "message": f"{recent_absences} absence(s) cette semaine."})
    if open_catchups:
        alerts.append({"level": "warning", "code": "catchup", "message": f"{open_catchups} demande(s) de rattrapage en attente."})
    if overdue_homeworks:
        alerts.append({"level": "danger", "code": "homework", "message": f"{overdue_homeworks} devoir(s) échu(s) sans copie."})
    for row in by_subject:
        if row["students"] and row["coverage_pct"] < 50:
            alerts.append(
                {
                    "level": "warning",
                    "code": "coverage",
                    "message": f"Couverture faible — {row['subject_name']} ({row['coverage_pct']} %).",
                }
            )

    evals = TeachingEvaluation.objects.filter(teacher=staff) if staff else TeachingEvaluation.objects.none()
    eval_avg = evals.aggregate(v=Avg("overall"))["v"]

    return Response(
        {
            "alerts": alerts,
            "subjects": by_subject,
            "kpis": {
                "drafts": drafts,
                "recent_absences": recent_absences,
                "pending_catchups": open_catchups,
                "overdue_homeworks": overdue_homeworks,
                "evaluation_avg": round(float(eval_avg), 2) if eval_avg is not None else None,
                "evaluations_count": evals.count(),
            },
        }
    )


@api_view(["GET"])
@permission_classes([require_permission("academic.grades.manage")])
def student_pedagogical_file(request, student_id):
    """Student pedagogical sheet for teachers (item 18)."""
    try:
        student = StudentProfile.objects.select_related("user", "program").get(pk=student_id)
    except StudentProfile.DoesNotExist:
        return Response({"detail": "Étudiant introuvable."}, status=404)

    staff = teacher_profile(request.user)
    subject_ids = []
    if staff:
        subject_ids = list(
            TeachingAssignment.objects.filter(teacher=staff).values_list("subject_id", flat=True)
        )

    grades = Grade.objects.filter(student=student, subject_id__in=subject_ids).select_related("subject")
    absences = AttendanceRecord.objects.filter(
        student=student, session__subject_id__in=subject_ids, status__in=["absent", "late"]
    ).select_related("session__subject")[:50]
    catchups = CatchUpRequest.objects.filter(student=student, teacher=staff) if staff else []

    avg = grades.filter(entry_status="scored", score__isnull=False).aggregate(v=Avg("score"))["v"]
    alerts = []
    if avg is not None and avg < 10:
        alerts.append("Moyenne sous la moyenne — suivi pédagogique recommandé.")
    if absences.count() >= 3:
        alerts.append("Absences répétées détectées.")

    return Response(
        {
            "student": {
                "id": str(student.id),
                "full_name": student.user.full_name,
                "student_number": student.student_number,
                "program": student.program.name if student.program else None,
                "email": student.user.email,
            },
            "avg_score": round(float(avg), 2) if avg is not None else None,
            "alerts": alerts,
            "grades": [
                {
                    "id": str(g.id),
                    "subject": g.subject.name,
                    "kind": g.kind,
                    "label": g.label,
                    "score": str(g.score) if g.score is not None else None,
                    "max_score": str(g.max_score),
                    "entry_status": g.entry_status,
                    "comment": g.comment,
                    "is_published": g.is_published,
                }
                for g in grades.order_by("-created_at")[:100]
            ],
            "attendance": [
                {
                    "date": r.session.session_date.isoformat(),
                    "subject": r.session.subject.name,
                    "status": r.status,
                    "comment": r.comment,
                }
                for r in absences
            ],
            "catchups": CatchUpRequestSerializer(catchups, many=True).data,
        }
    )
