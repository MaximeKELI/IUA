"""TOTP MFA helpers for sensitive roles."""

from __future__ import annotations

import pyotp
from django.conf import settings
from django.core import signing

MFA_TOKEN_SALT = "iua.mfa.pending"
MFA_TOKEN_MAX_AGE = 300  # 5 minutes


def user_needs_mfa_challenge(user) -> bool:
    if not user.mfa_enabled or not user.mfa_secret:
        return False
    roles = set(user.role_codes())
    sensitive = set(getattr(settings, "MFA_SENSITIVE_ROLES", ()))
    return bool(roles & sensitive) or user.is_superuser


def user_must_enroll_mfa(user) -> bool:
    if not getattr(settings, "IUA_REQUIRE_MFA_ENROLLMENT", False):
        return False
    if user.mfa_enabled and user.mfa_secret:
        return False
    roles = set(user.role_codes())
    sensitive = set(getattr(settings, "MFA_SENSITIVE_ROLES", ()))
    return bool(roles & sensitive) or user.is_superuser


def issue_mfa_token(user_id: str) -> str:
    return signing.dumps({"uid": str(user_id)}, salt=MFA_TOKEN_SALT)


def parse_mfa_token(token: str) -> str | None:
    try:
        data = signing.loads(token, salt=MFA_TOKEN_SALT, max_age=MFA_TOKEN_MAX_AGE)
        return data.get("uid")
    except signing.BadSignature:
        return None


def verify_totp(secret: str, code: str) -> bool:
    if not secret or not code:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code.strip(), valid_window=1)


def new_totp_secret() -> str:
    return pyotp.random_base32()


def provisioning_uri(secret: str, email: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name="IUA Digital Campus")
