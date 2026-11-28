from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
import os

INSECURE_FALLBACK = "insecure-dev-key-change-me-iua-digital-campus-32b"
_secret = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not _secret or _secret == INSECURE_FALLBACK:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be set to a strong unique value in production "
        "(do not use the insecure development fallback)."
    )
SECRET_KEY = _secret

DEBUG = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "true").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Fail closed: only origins explicitly listed
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]
if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS must be set in production.")

# Sensitive roles must enroll MFA when this flag is on
IUA_REQUIRE_MFA_ENROLLMENT = os.getenv("IUA_REQUIRE_MFA_ENROLLMENT", "true").lower() == "true"
# Never return JWTs in JSON body in production — HttpOnly cookies only
IUA_EXPOSE_TOKENS_IN_BODY = os.getenv("IUA_EXPOSE_TOKENS_IN_BODY", "false").lower() == "true"

PAYMENT_WEBHOOK_SECRET = os.getenv("PAYMENT_WEBHOOK_SECRET", "").strip()
if not PAYMENT_WEBHOOK_SECRET:
    raise ImproperlyConfigured("PAYMENT_WEBHOOK_SECRET must be set in production.")

JITSI_BASE_URL = os.getenv("JITSI_BASE_URL", "").strip()
if not JITSI_BASE_URL or "meet.jit.si" in JITSI_BASE_URL:
    raise ImproperlyConfigured(
        "JITSI_BASE_URL must point to an institutional Jitsi (not public meet.jit.si)."
    )

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")
if not FRONTEND_ORIGIN:
    raise ImproperlyConfigured("FRONTEND_ORIGIN must be set in production.")

_csrf = [
    o.strip()
    for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if o.strip()
]
if not _csrf:
    raise ImproperlyConfigured("CSRF_TRUSTED_ORIGINS must be set in production.")
CSRF_TRUSTED_ORIGINS = _csrf

EMAIL_HOST = os.getenv("EMAIL_HOST", "").strip()
if not EMAIL_HOST:
    raise ImproperlyConfigured("EMAIL_HOST must be set in production.")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@iua.local")

SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
