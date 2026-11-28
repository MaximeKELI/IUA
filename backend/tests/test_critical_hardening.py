import hashlib
import hmac
import json

import pytest
import pyotp
from django.urls import reverse
from rest_framework.test import APIClient

from apps.academic.models import AdminRequest, Institution, StudentProfile
from apps.admissions.models import AdmissionApplication
from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role
from apps.teaching.student_models import StudentPayment


@pytest.fixture
def seeded(db):
    seed_roles_and_permissions()


def _user(email: str, role: str) -> User:
    user = User.objects.create_user(
        email=email,
        password="SecurePass123!",
        first_name=role.title(),
        last_name="Test",
    )
    assign_role(user, role)
    return user


@pytest.mark.django_db
def test_student_cannot_escalate_admin_request_status(seeded):
    student = _user("esc@demo.iua.local", "student")
    client = APIClient()
    client.force_authenticate(user=student)
    res = client.post(
        reverse("admin-requests-list"),
        {
            "kind": "attestation",
            "subject": "Hack",
            "body": "x",
            "status": "done",
            "admin_note": "self-approved",
        },
        format="json",
    )
    assert res.status_code == 201, res.data
    assert res.data["status"] == "pending"
    assert res.data["admin_note"] == ""
    obj = AdminRequest.objects.get(pk=res.data["id"])
    assert obj.status == "pending"


@pytest.mark.django_db
def test_admission_create_and_staff_review(seeded):
    client = APIClient()
    create = client.post(
        reverse("admissions-list"),
        {
            "country": "Sénégal",
            "nationality": "Sénégalaise",
            "passport": "P123",
            "phone": "+221770000000",
            "email": "cand@example.com",
            "program": "Info",
            "diploma": "Bac",
            "payment_preference": "momo",
        },
        format="json",
    )
    assert create.status_code == 201, create.data
    app_id = create.data["id"]
    assert create.data["status"] == "submitted"

    staff = _user("adm-ad@demo.iua.local", "secretariat")
    client.force_authenticate(user=staff)
    review = client.post(
        reverse("admissions-review", args=[app_id]),
        {"status": "accepted", "staff_note": "OK dossier"},
        format="json",
    )
    assert review.status_code == 200, review.data
    assert review.data["status"] == "accepted"
    assert AdmissionApplication.objects.get(pk=app_id).reviewed_by_id == staff.id


@pytest.mark.django_db
def test_payment_webhook_hmac_and_idempotence(seeded):
    student_user = _user("pay-st@demo.iua.local", "student")
    profile = StudentProfile.objects.create(user=student_user, student_number="PAY1")
    payment = StudentPayment.objects.create(
        student=profile, label="Frais", amount_xof=1000, status="due"
    )
    body = {
        "payment_id": str(payment.id),
        "idempotency_key": "idem-1",
        "provider_ref": "MM-99",
        "status": "paid",
    }
    raw = json.dumps(body).encode()
    from django.conf import settings

    sig = hmac.new(settings.PAYMENT_WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    client = APIClient()

    bad = client.post(
        reverse("payments-webhook"),
        data=raw,
        content_type="application/json",
        HTTP_X_IUA_SIGNATURE="deadbeef",
    )
    assert bad.status_code == 401

    ok = client.generic(
        "POST",
        reverse("payments-webhook"),
        data=raw,
        content_type="application/json",
        HTTP_X_IUA_SIGNATURE=sig,
    )
    assert ok.status_code == 200, ok.content
    payment.refresh_from_db()
    assert payment.status == "paid"
    assert payment.idempotency_key == "idem-1"

    replay = client.generic(
        "POST",
        reverse("payments-webhook"),
        data=raw,
        content_type="application/json",
        HTTP_X_IUA_SIGNATURE=sig,
    )
    assert replay.status_code == 200
    assert replay.json().get("idempotent") is True


@pytest.mark.django_db
def test_payment_staff_confirm(seeded):
    student_user = _user("pay2@demo.iua.local", "student")
    profile = StudentProfile.objects.create(user=student_user, student_number="PAY2")
    payment = StudentPayment.objects.create(
        student=profile, label="Inscription", amount_xof=5000, status="due"
    )
    staff = _user("fin@demo.iua.local", "secretariat")
    client = APIClient()
    client.force_authenticate(user=staff)
    res = client.post(reverse("payments-confirm", args=[payment.id]), {}, format="json")
    assert res.status_code == 200, res.data
    payment.refresh_from_db()
    assert payment.status == "paid"
    assert payment.paid_at is not None


@pytest.mark.django_db
def test_attestation_pdf(seeded):
    student_user = _user("pdf@demo.iua.local", "student")
    StudentProfile.objects.create(user=student_user, student_number="PDF1")
    client = APIClient()
    client.force_authenticate(user=student_user)
    res = client.get(reverse("documents-attestation") + "?lang=fr")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
    assert res.content[:4] == b"%PDF"


@pytest.mark.django_db
def test_transcript_pdf(seeded):
    student_user = _user("tr@demo.iua.local", "student")
    StudentProfile.objects.create(user=student_user, student_number="TR1")
    client = APIClient()
    client.force_authenticate(user=student_user)
    res = client.get(reverse("documents-transcript") + "?lang=en")
    assert res.status_code == 200
    assert res.content[:4] == b"%PDF"


@pytest.mark.django_db
def test_international_kpis_not_hardcoded(seeded):
    from apps.teaching.ops_views import _international_kpis

    kpi = _international_kpis()
    assert kpi["students"] == 0
    assert kpi["alumni_abroad"] == 0
    assert "total_active_students" in kpi


@pytest.mark.django_db
def test_mfa_challenge_and_verify(seeded):
    admin = _user("mfa@demo.iua.local", "admin")
    secret = pyotp.random_base32()
    admin.mfa_secret = secret
    admin.mfa_enabled = True
    admin.save(update_fields=["mfa_secret", "mfa_enabled"])

    client = APIClient()
    login = client.post(
        reverse("auth-login"),
        {"email": "mfa@demo.iua.local", "password": "SecurePass123!"},
        format="json",
    )
    assert login.status_code == 200
    assert login.data.get("mfa_required") is True
    token = login.data["mfa_token"]
    code = pyotp.TOTP(secret).now()
    verify = client.post(
        reverse("auth-mfa-verify"),
        {"mfa_token": token, "code": code},
        format="json",
    )
    assert verify.status_code == 200, verify.data
    assert "access" in verify.data
