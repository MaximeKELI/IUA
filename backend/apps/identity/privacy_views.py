"""GDPR-ish self-service data export (DSAR stub — production-ready structure)."""

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.serializers import UserSerializer


class PrivacyExportView(APIView):
    """Authenticated user exports their personal data package."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from apps.academic.models import AdminRequest, Grade, StudentProfile
        from apps.notifications.models import Notification

        student = StudentProfile.objects.filter(user=user).first()
        person = getattr(user, "person", None)
        payload = {
            "exported_at": timezone.now().isoformat(),
            "subject": UserSerializer(user, context={"request": request}).data,
            "person_profile": None,
            "student_profile": None,
            "grades_published": [],
            "admin_requests": [],
            "notifications_sample": [],
            "retention_note": (
                "Export DSAR — conservation selon politique IUA. "
                "Pour suppression, contactez dpo@iua.local."
            ),
        }
        if person:
            payload["person_profile"] = {
                "nationality": person.nationality,
                "country": person.country,
                "city": person.city,
                "gender": person.gender,
            }
        if student:
            payload["student_profile"] = {
                "student_number": student.student_number,
                "level": student.level,
                "status": student.status,
                "program": student.program.name if student.program_id else None,
            }
            payload["grades_published"] = list(
                Grade.objects.filter(student=student, is_published=True).values(
                    "kind", "score", "max_score", "entry_status", "subject__name", "created_at"
                )[:500]
            )
        payload["admin_requests"] = list(
            AdminRequest.objects.filter(requester=user).values(
                "kind", "subject", "status", "created_at", "admin_note"
            )[:200]
        )
        payload["notifications_sample"] = list(
            Notification.objects.filter(recipient=user)
            .order_by("-created_at")
            .values("title", "category", "created_at", "is_read")[:100]
        )
        try:
            from apps.teaching.ops_views import log_audit

            log_audit(user, "privacy.export", "User", str(user.id))
        except Exception:
            pass
        return Response(payload)


class PrivacyEraseRequestView(APIView):
    """Record an erasure request (does not auto-delete — compliance review)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        reason = str(request.data.get("reason") or "")[:500]
        try:
            from apps.teaching.ops_views import log_audit

            log_audit(
                request.user,
                "privacy.erase_request",
                "User",
                f"{request.user.id}:{reason}",
            )
        except Exception:
            pass
        return Response(
            {
                "status": "received",
                "message": "Demande d'effacement enregistrée. Le DPO IUA traitera sous 30 jours.",
            }
        )
