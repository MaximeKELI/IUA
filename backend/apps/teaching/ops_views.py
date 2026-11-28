"""Direction & secretariat (ops) hubs and list endpoints."""

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academic.models import (
    AdminRequest,
    Cohort,
    Enrollment,
    Grade,
    Institution,
    StudentProfile,
    TeachingAssignment,
)
from apps.identity.models import User
from apps.notifications.models import Notification
from apps.teaching.models import (
    AttendanceRecord,
    GradeSheetSignature,
    ScheduleSlot,
    TeachingEvaluation,
)
from apps.teaching.ops_models import AuditEvent, CampusAnnouncement, MobilityPartner
from apps.teaching.student_models import ExamEvent, Internship, ScholarshipOffer, StudentPayment


OPS_ROLES = ("admin", "super_admin", "secretariat", "academic_dir", "direction", "finance_dir")
DIR_ROLES = ("direction", "super_admin", "academic_dir", "finance_dir", "admin")
# Direction incluse : pouvoirs de validation proportionnels au grade (supervision).
MANAGE_ROLES = ("admin", "super_admin", "secretariat", "academic_dir", "direction")

def _international_kpis() -> dict:
    """Real aggregates only — never invent constants for auditors."""
    from apps.identity.models import PersonProfile

    total = StudentProfile.objects.filter(status="active").count()
    # Blank country defaults to domestic (CI); count only explicit foreign countries.
    foreign = (
        PersonProfile.objects.filter(user__student_profile__status="active")
        .exclude(country="")
        .exclude(country__iexact="Côte d'Ivoire")
    )
    intl_students = foreign.count()
    countries = foreign.values_list("country", flat=True).distinct().count()
    alumni_abroad = (
        PersonProfile.objects.filter(
            user__user_roles__role__code="alumni",
            user__user_roles__is_active=True,
        )
        .exclude(country="")
        .exclude(country__iexact="Côte d'Ivoire")
        .distinct()
        .count()
    )
    share = round((intl_students / total) * 100, 1) if total else 0.0
    return {
        "students": intl_students,
        "share_pct": share,
        "countries": countries,
        "alumni_abroad": alumni_abroad,
        "total_active_students": total,
    }


def is_ops(user) -> bool:
    return user.is_superuser or user.has_any_role(*OPS_ROLES)


def is_dir(user) -> bool:
    return user.is_superuser or user.has_any_role(*DIR_ROLES)


def can_manage(user) -> bool:
    return user.is_superuser or user.has_any_role(*MANAGE_ROLES)


class CampusAnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = CampusAnnouncement
        fields = "__all__"
        read_only_fields = ("author",)

    def get_author_name(self, obj):
        return obj.author.full_name if obj.author else ""


class MobilityPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = MobilityPartner
        fields = "__all__"


class AuditEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditEvent
        fields = "__all__"
        read_only_fields = ("actor",)

    def get_actor_name(self, obj):
        return obj.actor.full_name if obj.actor else "Système"


def log_audit(user, action, entity="", detail=""):
    AuditEvent.objects.create(actor=user if user and user.is_authenticated else None, action=action, entity=entity, detail=detail)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def direction_hub(request):
    if not is_dir(request.user):
        return Response({"detail": "Accès direction requis."}, status=403)

    payments = StudentPayment.objects.all()
    due = payments.filter(status__in=["due", "overdue", "partial"])
    grades = Grade.objects.filter(is_published=True, entry_status="scored", score__isnull=False)
    ratios = []
    for g in grades:
        if g.max_score and float(g.max_score) > 0 and g.score is not None:
            ratios.append(float(g.score) / float(g.max_score) * 20)
    avg = round(sum(ratios) / len(ratios), 2) if ratios else None
    pass_rate = (
        round(100 * sum(1 for r in ratios if r >= 10) / len(ratios), 1) if ratios else None
    )

    by_faculty = list(
        StudentProfile.objects.values("program__faculty__name")
        .annotate(total=Count("id"))
        .order_by("-total")[:20]
    )

    return Response(
        {
            "students": StudentProfile.objects.count(),
            "teachers": User.objects.filter(user_roles__role__code="teacher", user_roles__is_active=True)
            .distinct()
            .count(),
            "enrollments": Enrollment.objects.filter(status="active").count(),
            "pending_requests": AdminRequest.objects.filter(status="pending").count(),
            "avg_score": avg,
            "pass_rate": pass_rate,
            "finance": {
                "due_count": due.count(),
                "due_amount": due.aggregate(v=Sum("amount_xof"))["v"] or 0,
                "paid_count": payments.filter(status="paid").count(),
                "paid_amount": payments.filter(status="paid").aggregate(v=Sum("amount_xof"))["v"] or 0,
            },
            "absences": AttendanceRecord.objects.filter(status__in=["absent", "late"]).count(),
            "evaluations_count": TeachingEvaluation.objects.count(),
            "evaluations_avg": TeachingEvaluation.objects.aggregate(v=Avg("overall"))["v"],
            "pv_count": GradeSheetSignature.objects.count(),
            "exams_upcoming": ExamEvent.objects.filter(starts_at__gte=timezone.now()).count(),
            "partners": MobilityPartner.objects.filter(is_active=True).count(),
            "international": _international_kpis(),
            "by_faculty": [
                {"faculty": r["program__faculty__name"] or "Non affecté", "total": r["total"]}
                for r in by_faculty
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ops_hub(request):
    if not is_ops(request.user):
        return Response({"detail": "Accès secrétariat requis."}, status=403)

    now = timezone.now()
    return Response(
        {
            "pending_requests": AdminRequest.objects.filter(status="pending").count(),
            "in_progress_requests": AdminRequest.objects.filter(status="in_progress").count(),
            "active_enrollments": Enrollment.objects.filter(status="active").count(),
            "payments_due": StudentPayment.objects.filter(status__in=["due", "overdue", "partial"]).count(),
            "payments_due_amount": StudentPayment.objects.filter(status__in=["due", "overdue", "partial"]).aggregate(
                v=Sum("amount_xof")
            )["v"]
            or 0,
            "upcoming_exams": ExamEvent.objects.filter(starts_at__gte=now).count(),
            "internships_open": Internship.objects.filter(status__in=["searching", "ongoing"]).count(),
            "scholarships_active": ScholarshipOffer.objects.filter(is_active=True).count(),
            "cohorts": Cohort.objects.count(),
            "schedule_slots": ScheduleSlot.objects.count(),
            "absences": AttendanceRecord.objects.filter(status__in=["absent", "late"]).count(),
            "announcements": CampusAnnouncement.objects.filter(is_published=True).count(),
            "students": StudentProfile.objects.count(),
            "unread_staff_notifications": Notification.objects.filter(
                recipient=request.user, is_read=False
            ).count(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def direction_performance(request):
    if not is_dir(request.user):
        return Response({"detail": "Accès direction requis."}, status=403)
    grades = Grade.objects.filter(is_published=True, entry_status="scored", score__isnull=False).select_related(
        "subject"
    )
    by_subject: dict[str, list[float]] = {}
    for g in grades:
        if g.max_score and float(g.max_score) > 0 and g.score is not None:
            by_subject.setdefault(g.subject.name, []).append(float(g.score) / float(g.max_score) * 20)
    rows = []
    for name, vals in sorted(by_subject.items()):
        avg = round(sum(vals) / len(vals), 2)
        rows.append(
            {
                "subject": name,
                "avg": avg,
                "count": len(vals),
                "pass_rate": round(100 * sum(1 for v in vals if v >= 10) / len(vals), 1),
            }
        )
    return Response({"subjects": rows})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def direction_institution(request):
    if not is_dir(request.user) and not is_ops(request.user):
        return Response({"detail": "Accès réservé."}, status=403)
    inst = Institution.objects.filter(is_active=True).first()
    if not inst:
        return Response({})
    return Response(
        {
            "id": str(inst.id),
            "code": inst.code,
            "name": inst.name,
            "short_name": inst.short_name,
            "country": inst.country,
            "city": inst.city,
            "address": inst.address,
            "email": inst.email,
            "phone": inst.phone,
            "website": inst.website,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ops_attendance_export(request):
    if not is_ops(request.user):
        return Response({"detail": "Accès secrétariat requis."}, status=403)
    qs = (
        AttendanceRecord.objects.filter(status__in=["absent", "late"])
        .select_related("student__user", "session__subject")
        .order_by("-created_at")[:200]
    )
    rows = [
        {
            "id": str(r.id),
            "student": r.student.user.full_name,
            "student_number": r.student.student_number,
            "subject": r.session.subject.name if r.session_id else "",
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in qs
    ]
    return Response({"count": len(rows), "results": rows})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ops_import_students_preview(request):
    """Accept CSV text preview (no write) — validates rows for secretariat."""
    if not can_manage(request.user):
        return Response({"detail": "Permission insuffisante."}, status=403)
    raw = request.data.get("csv", "")
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    if not lines:
        return Response({"detail": "CSV vide."}, status=400)
    header = [h.strip().lower() for h in lines[0].split(",")]
    rows = []
    for ln in lines[1:51]:
        parts = [p.strip() for p in ln.split(",")]
        row = {header[i]: parts[i] if i < len(parts) else "" for i in range(len(header))}
        rows.append(row)
    log_audit(request.user, "import_preview", "StudentProfile", f"{len(rows)} lignes")
    return Response({"header": header, "preview": rows, "total_lines": max(0, len(lines) - 1)})


class CampusAnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = CampusAnnouncementSerializer
    queryset = CampusAnnouncement.objects.select_related("author").all().order_by("-created_at")
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not is_ops(self.request.user) and not is_dir(self.request.user):
            return qs.none()
        return qs

    def perform_create(self, serializer):
        if not can_manage(self.request.user) and not is_dir(self.request.user):
            raise PermissionDenied("Forbidden")
        obj = serializer.save(author=self.request.user)
        log_audit(self.request.user, "create", "CampusAnnouncement", obj.title)


class MobilityPartnerViewSet(viewsets.ModelViewSet):
    serializer_class = MobilityPartnerSerializer
    queryset = MobilityPartner.objects.all().order_by("name")
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        if not is_ops(self.request.user) and not is_dir(self.request.user):
            return MobilityPartner.objects.none()
        return super().get_queryset()

    def perform_create(self, serializer):
        if not can_manage(self.request.user) and not is_dir(self.request.user):
            raise PermissionDenied("Forbidden")
        obj = serializer.save()
        log_audit(self.request.user, "create", "MobilityPartner", obj.name)


class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditEventSerializer
    queryset = AuditEvent.objects.select_related("actor").all().order_by("-created_at")

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        if not is_dir(self.request.user) and not can_manage(self.request.user):
            return AuditEvent.objects.none()
        return super().get_queryset()[:200]


class OpsCohortViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if not is_ops(request.user) and not is_dir(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        rows = []
        for c in Cohort.objects.select_related("program", "academic_year").annotate(
            student_count=Count("enrollments", distinct=True)
        )[:100]:
            rows.append(
                {
                    "id": str(c.id),
                    "name": c.name,
                    "code": c.code,
                    "program": c.program.name,
                    "year": c.academic_year.name,
                    "students": c.student_count,
                }
            )
        return Response({"count": len(rows), "results": rows})


class OpsScheduleViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if not is_ops(request.user) and not is_dir(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        slots = ScheduleSlot.objects.select_related("subject", "teacher__user").order_by("weekday", "start_time")[
            :200
        ]
        days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
        results = [
            {
                "id": str(s.id),
                "subject": s.subject.name,
                "teacher": s.teacher.user.full_name if s.teacher_id else "",
                "weekday": s.weekday,
                "weekday_label": days[s.weekday] if 0 <= s.weekday < 7 else str(s.weekday),
                "start_time": str(s.start_time)[:5],
                "end_time": str(s.end_time)[:5],
                "room": s.room,
            }
            for s in slots
        ]
        return Response({"count": len(results), "results": results})


class OpsPaymentsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if not is_ops(request.user) and not is_dir(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        qs = StudentPayment.objects.select_related("student__user").order_by("status", "due_date")[:200]
        results = [
            {
                "id": str(p.id),
                "student": p.student.user.full_name,
                "student_number": p.student.student_number,
                "label": p.label,
                "amount_xof": p.amount_xof,
                "status": p.status,
                "due_date": p.due_date.isoformat() if p.due_date else None,
                "method": p.method,
            }
            for p in qs
        ]
        return Response({"count": len(results), "results": results})


class OpsExamsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if not is_ops(request.user) and not is_dir(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        qs = ExamEvent.objects.select_related("student__user").order_by("starts_at")[:200]
        results = [
            {
                "id": str(e.id),
                "title": e.title,
                "subject_name": e.subject_name,
                "starts_at": e.starts_at.isoformat(),
                "room": e.room,
                "program_code": e.program_code,
                "student": e.student.user.full_name if e.student_id else "Promotion",
            }
            for e in qs
        ]
        return Response({"count": len(results), "results": results})

    def create(self, request):
        if not can_manage(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        e = ExamEvent.objects.create(
            title=request.data.get("title", "Examen"),
            subject_name=request.data.get("subject_name", ""),
            starts_at=request.data.get("starts_at") or timezone.now(),
            room=request.data.get("room", ""),
            program_code=request.data.get("program_code", ""),
            notes=request.data.get("notes", ""),
        )
        log_audit(request.user, "create", "ExamEvent", e.title)
        return Response({"id": str(e.id), "title": e.title}, status=201)


class OpsInternshipsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if not is_ops(request.user) and not is_dir(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        qs = Internship.objects.select_related("student__user").order_by("-created_at")[:100]
        results = [
            {
                "id": str(i.id),
                "student": i.student.user.full_name,
                "company": i.company,
                "role": i.role,
                "city": i.city,
                "status": i.status,
            }
            for i in qs
        ]
        return Response({"count": len(results), "results": results})


class OpsScholarshipsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if not is_ops(request.user) and not is_dir(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        qs = ScholarshipOffer.objects.order_by("deadline")
        results = [
            {
                "id": str(s.id),
                "title": s.title,
                "provider": s.provider,
                "amount_label": s.amount_label,
                "deadline": s.deadline.isoformat() if s.deadline else None,
                "is_active": s.is_active,
            }
            for s in qs
        ]
        return Response({"count": len(results), "results": results})


class OpsStudentCardsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if not is_ops(request.user) and not is_dir(request.user):
            return Response({"detail": "Forbidden"}, status=403)
        qs = StudentProfile.objects.select_related("user", "program", "cohort").order_by("student_number")[:200]
        results = [
            {
                "id": str(s.id),
                "full_name": s.user.full_name,
                "student_number": s.student_number,
                "email": s.user.email,
                "program": s.program.name if s.program_id else "",
                "cohort": s.cohort.name if s.cohort_id else "",
                "level": s.level,
                "status": s.status if hasattr(s, "status") else "active",
            }
            for s in qs
        ]
        return Response({"count": len(results), "results": results})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ops_queue(request):
    """Pending admin requests queue for secretariat offline/file view."""
    if not is_ops(request.user):
        return Response({"detail": "Forbidden"}, status=403)
    pending = AdminRequest.objects.filter(status__in=["pending", "in_progress"]).select_related("requester")[:100]
    results = [
        {
            "id": str(r.id),
            "subject": r.subject,
            "kind": r.kind,
            "status": r.status,
            "requester": r.requester.full_name,
            "created_at": r.created_at.isoformat(),
        }
        for r in pending
    ]
    return Response({"count": len(results), "results": results})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def direction_quality(request):
    if not is_dir(request.user):
        return Response({"detail": "Forbidden"}, status=403)
    evals = TeachingEvaluation.objects.select_related("subject", "teacher__user").order_by("-created_at")[:100]
    results = [
        {
            "id": str(e.id),
            "subject": e.subject.name,
            "teacher": e.teacher.user.full_name,
            "clarity": e.clarity,
            "usefulness": e.usefulness,
            "pacing": e.pacing,
            "overall": e.overall,
            "comment": e.comment if not e.is_anonymous else "(anonyme)",
            "is_anonymous": e.is_anonymous,
        }
        for e in evals
    ]
    avg = TeachingEvaluation.objects.aggregate(
        clarity=Avg("clarity"), usefulness=Avg("usefulness"), pacing=Avg("pacing"), overall=Avg("overall")
    )
    return Response({"averages": avg, "results": results})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def direction_pv(request):
    if not is_dir(request.user) and not is_ops(request.user):
        return Response({"detail": "Forbidden"}, status=403)
    qs = GradeSheetSignature.objects.select_related("subject", "teacher__user", "academic_year").order_by(
        "-signed_at"
    )[:100]
    results = [
        {
            "id": str(s.id),
            "subject": s.subject.name,
            "teacher": s.teacher.user.full_name,
            "year": s.academic_year.name if s.academic_year_id else "",
            "signed_at": s.signed_at.isoformat() if s.signed_at else None,
            "payload_hash": s.payload_hash[:16] + "…" if s.payload_hash else "",
        }
        for s in qs
    ]
    return Response({"count": len(results), "results": results})
