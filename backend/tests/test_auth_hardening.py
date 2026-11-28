import pytest
from django.core import mail
from django.urls import reverse
from rest_framework.test import APIClient

from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.mfa import issue_mfa_enroll_token, new_totp_secret, verify_totp
from apps.identity.models import User
from apps.identity.services import assign_role
import pyotp


@pytest.fixture
def seeded(db):
    seed_roles_and_permissions()


def _user(email, role, **kwargs):
    u = User.objects.create_user(
        email=email, password="SecurePass123!", first_name="A", last_name="B", **kwargs
    )
    assign_role(u, role)
    return u


@pytest.mark.django_db
def test_password_reset_no_enumeration(seeded, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    client = APIClient()
    unknown = client.post(
        reverse("auth-password-reset"), {"email": "nobody@demo.iua.local"}, format="json"
    )
    assert unknown.status_code == 200
    _user("known@demo.iua.local", "student")
    known = client.post(
        reverse("auth-password-reset"), {"email": "known@demo.iua.local"}, format="json"
    )
    assert known.status_code == 200
    assert known.data["message"] == unknown.data["message"]
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_mfa_enroll_flow(seeded, settings):
    settings.IUA_REQUIRE_MFA_ENROLLMENT = True
    settings.MFA_SENSITIVE_ROLES = ("direction",)
    user = _user("dir@demo.iua.local", "direction")
    client = APIClient()
    login = client.post(
        reverse("auth-login"),
        {"email": "dir@demo.iua.local", "password": "SecurePass123!"},
        format="json",
    )
    assert login.status_code == 200
    assert login.data.get("mfa_enrollment_required") is True
    token = login.data["mfa_enrollment_token"]
    setup = client.post(
        reverse("auth-mfa-enroll-setup"),
        {"mfa_enrollment_token": token},
        format="json",
    )
    assert setup.status_code == 200
    secret = setup.data["secret"]
    code = pyotp.TOTP(secret).now()
    confirm = client.post(
        reverse("auth-mfa-enroll-confirm"),
        {"mfa_enrollment_token": token, "code": code},
        format="json",
    )
    assert confirm.status_code == 200
    user.refresh_from_db()
    assert user.mfa_enabled is True


@pytest.mark.django_db
def test_health_metrics_alive(seeded):
    client = APIClient()
    assert client.get("/health/live/").status_code == 200


@pytest.mark.django_db
def test_password_reset_email_uses_frontend_origin(seeded, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.FRONTEND_ORIGIN = "https://campus.example.com"
    settings.FRONTEND_DEFAULT_LOCALE = "fr"
    _user("reset@demo.iua.local", "student")
    client = APIClient()
    res = client.post(
        reverse("auth-password-reset"),
        {"email": "reset@demo.iua.local"},
        format="json",
    )
    assert res.status_code == 200
    assert len(mail.outbox) == 1
    assert "https://campus.example.com/fr/connexion?reset=" in mail.outbox[0].body


@pytest.mark.django_db
def test_health_metrics(seeded):
    client = APIClient()
    res = client.get("/health/metrics/")
    assert res.status_code == 200
    assert b"iua_users_active" in res.content
