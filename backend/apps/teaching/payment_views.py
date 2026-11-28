"""Payment webhook (HMAC) + staff manual confirmation."""

from __future__ import annotations

import hashlib
import hmac
import logging

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.teaching.student_models import StudentPayment

logger = logging.getLogger("iua.payments")


def _verify_signature(raw_body: bytes, signature: str) -> bool:
    secret = (getattr(settings, "PAYMENT_WEBHOOK_SECRET", "") or "").encode()
    if not secret or not signature:
        return False
    expected = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.strip())


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_webhook(request):
    """
    Provider callback.
    Headers: X-IUA-Signature: hex(HMAC-SHA256(body, PAYMENT_WEBHOOK_SECRET))
    Body JSON: payment_id, idempotency_key, provider_ref, status (=paid)
    """
    signature = request.headers.get("X-IUA-Signature") or request.META.get("HTTP_X_IUA_SIGNATURE", "")
    raw = request.body or b""
    if not _verify_signature(raw, signature):
        return Response({"detail": "Signature invalide."}, status=401)

    data = request.data
    payment_id = data.get("payment_id")
    idem = data.get("idempotency_key") or ""
    provider_ref = data.get("provider_ref") or ""
    new_status = data.get("status") or "paid"

    if not payment_id:
        return Response({"detail": "payment_id requis."}, status=400)
    if new_status != "paid":
        return Response({"detail": "Seuls les webhooks status=paid sont acceptés."}, status=400)

    try:
        with transaction.atomic():
            payment = StudentPayment.objects.select_for_update().get(pk=payment_id)
            if payment.status == StudentPayment.Status.PAID:
                # Idempotent replay
                return Response(
                    {
                        "id": str(payment.id),
                        "status": payment.status,
                        "idempotent": True,
                    }
                )
            if idem:
                # Unique constraint — reject reuse on another payment
                conflict = (
                    StudentPayment.objects.filter(idempotency_key=idem)
                    .exclude(pk=payment.pk)
                    .exists()
                )
                if conflict:
                    return Response({"detail": "idempotency_key déjà utilisé."}, status=409)
                payment.idempotency_key = idem
            payment.status = StudentPayment.Status.PAID
            payment.provider_ref = provider_ref or payment.provider_ref
            payment.paid_at = timezone.now()
            payment.method = payment.method or data.get("method") or "webhook"
            payment.save()
    except StudentPayment.DoesNotExist:
        return Response({"detail": "Paiement introuvable."}, status=404)
    except IntegrityError:
        return Response({"detail": "Conflit d'idempotence."}, status=409)

    try:
        from apps.teaching.ops_views import log_audit

        log_audit(None, "payment.webhook_paid", "StudentPayment", f"{payment_id}")
    except Exception:
        logger.exception("payment webhook audit failed")

    return Response({"id": str(payment.id), "status": payment.status, "paid_at": payment.paid_at})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_confirm(request, pk):
    """Staff manual confirmation of funds received."""
    user = request.user
    if not (
        user.is_superuser
        or user.has_perm_code("services.request.manage")
        or user.has_any_role("finance_dir", "admin", "secretariat", "direction")
    ):
        return Response({"detail": "Permission insuffisante."}, status=403)

    try:
        payment = StudentPayment.objects.get(pk=pk)
    except StudentPayment.DoesNotExist:
        return Response({"detail": "Paiement introuvable."}, status=404)

    if payment.status == StudentPayment.Status.PAID:
        return Response({"id": str(payment.id), "status": payment.status, "idempotent": True})

    payment.status = StudentPayment.Status.PAID
    payment.paid_at = timezone.now()
    payment.method = payment.method or "manual"
    note = request.data.get("note") or ""
    if note:
        payment.reference = (payment.reference + " | " + note).strip(" |")
    payment.save()

    try:
        from apps.teaching.ops_views import log_audit

        log_audit(user, "payment.manual_confirm", "StudentPayment", f"{pk}")
    except Exception:
        logger.exception("payment confirm audit failed")

    return Response(
        {
            "id": str(payment.id),
            "status": payment.status,
            "paid_at": payment.paid_at,
        }
    )
