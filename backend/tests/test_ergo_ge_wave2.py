import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.academic.document_verify import issue_document_token, verify_document_token
from apps.academic.document_views import _build_attestation_pdf
from apps.academic.models import StudentProfile
from apps.admissions.models import AdmissionApplication
from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role
from apps.notifications.services import notify_user, send_transactional_mail


@pytest.fixture
def seeded():
    seed_roles_and_permissions()


def _student(email: str = "stu-wave2@demo.iua.local") -> User:
    user = User.objects.create_user(
        email=email,
        password="SecurePass123!",
        first_name="Stu",
        last_name="Wave",
    )
    assign_role(user, "student")
    StudentProfile.objects.create(user=user, student_number="W2-001")
    return user


@pytest.mark.django_db
def test_transactional_mail_locmem():
    assert send_transactional_mail(to="a@example.com", subject="IUA — note", body="publiée")
    assert len(mail.outbox) == 1
    assert "IUA — note" in mail.outbox[0].subject


@pytest.mark.django_db
def test_admission_tracking_token():
    app = AdmissionApplication.objects.create(
        country="SN",
        nationality="Sénégalaise",
        passport="P123",
        phone="+221770000000",
        email="candidat@example.com",
        program="Licence Info",
    )
    assert app.tracking_token
    client = APIClient()
    res = client.get(f"/api/v1/admissions/applications/track/{app.tracking_token}/")
    assert res.status_code == 200
    assert res.data["status"] == "submitted"
    assert res.data["email"] == "candidat@example.com"


@pytest.mark.django_db
def test_document_verify_and_qr_pdf(seeded):
    user = _student()
    profile = user.student_profile
    token = issue_document_token(profile=profile, doc_type="attestation", locale="fr")
    assert verify_document_token(token)
    pdf = _build_attestation_pdf(profile, locale="fr")
    assert len(pdf) > 500
    client = APIClient()
    res = client.get(f"/api/v1/documents/verify/{token}/")
    assert res.status_code == 200
    assert res.data["valid"] is True
    assert res.data["student_number"] == profile.student_number


@pytest.mark.django_db
def test_unified_calendar_ics(seeded):
    user = _student("cal@demo.iua.local")
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.get("/api/v1/calendar/")
    assert res.status_code == 200
    assert "events" in res.data
    ics = client.get("/api/v1/calendar.ics")
    assert ics.status_code == 200
    assert "text/calendar" in ics["Content-Type"]
    assert b"BEGIN:VCALENDAR" in ics.content


@pytest.mark.django_db
def test_notify_user_sends_email(seeded):
    user = _student("mail@demo.iua.local")
    mail.outbox.clear()
    notify_user(
        user=user,
        title="Note publiée — Maths",
        body="Note : 14/20",
        category="grades",
    )
    assert len(mail.outbox) == 1
    assert "Note publiée" in mail.outbox[0].subject
