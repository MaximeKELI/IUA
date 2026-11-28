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

PAYMENT_WEBHOOK_SECRET = os.getenv("PAYMENT_WEBHOOK_SECRET", "").strip()
if not PAYMENT_WEBHOOK_SECRET:
    raise ImproperlyConfigured("PAYMENT_WEBHOOK_SECRET must be set in production.")
