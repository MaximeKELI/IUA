"""Signed document verification tokens + public lookup."""

from __future__ import annotations

from django.core import signing
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.academic.models import StudentProfile

VERIFY_SALT = "iua.document.verify.v1"
VERIFY_MAX_AGE = 60 * 60 * 24 * 365 * 2  # 2 years


class VerifyThrottle(AnonRateThrottle):
    scope = "document_verify"
    rate = "60/hour"


def issue_document_token(
    *,
    profile: StudentProfile,
    doc_type: str,
    locale: str = "fr",
) -> str:
    payload = {
        "sid": str(profile.id),
        "sn": profile.student_number,
        "name": profile.user.full_name,
        "doc": doc_type,
        "lang": locale,
        "issued": timezone.now().isoformat(),
    }
    return signing.dumps(payload, salt=VERIFY_SALT)


def verify_document_token(token: str) -> dict | None:
    try:
        data = signing.loads(token, salt=VERIFY_SALT, max_age=VERIFY_MAX_AGE)
    except signing.BadSignature:
        return None
    except signing.SignatureExpired:
        return None
    if not isinstance(data, dict) or not data.get("sid"):
        return None
    return data


def verify_page_url(token: str) -> str:
    from django.conf import settings

    origin = getattr(settings, "FRONTEND_ORIGIN", "http://127.0.0.1:3000").rstrip("/")
    locale = getattr(settings, "FRONTEND_DEFAULT_LOCALE", "fr")
    return f"{origin}/{locale}/verify/{token}"


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([VerifyThrottle])
def document_verify(request, token: str):
    data = verify_document_token(token)
    if not data:
        return Response({"valid": False, "detail": "Jeton invalide ou expiré."}, status=404)
    profile = (
        StudentProfile.objects.select_related("user", "program")
        .filter(pk=data["sid"])
        .first()
    )
    if not profile:
        return Response({"valid": False, "detail": "Profil introuvable."}, status=404)
    return Response(
        {
            "valid": True,
            "document_type": data.get("doc"),
            "locale": data.get("lang"),
            "issued_at": data.get("issued"),
            "student_number": profile.student_number,
            "full_name": profile.user.full_name,
            "program": profile.program.name if profile.program_id else None,
            "status": profile.status,
            "institution": "Institut Universitaire d'Abidjan",
        }
    )
