import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.academic.models import AdminRequest
from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role


@pytest.fixture
def seeded():
    seed_roles_and_permissions()


def _user(email: str, role: str) -> User:
    user = User.objects.create_user(
        email=email,
        password="SecurePass123!",
        first_name=role.title(),
        last_name="Demo",
    )
    assign_role(user, role)
    return user


@pytest.mark.django_db
def test_student_creates_and_staff_approves(seeded):
    student = _user("student-req@demo.iua.local", "student")
    secretariat = _user("sec-req@demo.iua.local", "secretariat")
    teacher = _user("teacher-req@demo.iua.local", "teacher")

    client = APIClient()
    client.force_authenticate(user=student)
    create = client.post(
        reverse("admin-requests-list"),
        {"kind": "attestation", "subject": "Attestation S1", "body": "Pour visa"},
        format="json",
    )
    assert create.status_code == 201, create.data
    req_id = create.data["id"]
    assert create.data["status"] == "pending"

    # Teacher cannot approve
    client.force_authenticate(user=teacher)
    denied = client.post(
        reverse("admin-requests-approve", args=[req_id]),
        {"admin_note": "non"},
        format="json",
    )
    assert denied.status_code == 403

    # Secretariat claims then approves
    client.force_authenticate(user=secretariat)
    claim = client.post(reverse("admin-requests-claim", args=[req_id]), {}, format="json")
    assert claim.status_code == 200, claim.data
    assert claim.data["status"] == "in_progress"

    approve = client.post(
        reverse("admin-requests-approve", args=[req_id]),
        {"admin_note": "Document prêt"},
        format="json",
    )
    assert approve.status_code == 200, approve.data
    assert approve.data["status"] == "done"
    assert approve.data["admin_note"] == "Document prêt"

    assert AdminRequest.objects.get(pk=req_id).handled_by_id == secretariat.id


@pytest.mark.django_db
def test_direction_can_reject(seeded):
    student = _user("student-rej@demo.iua.local", "student")
    direction = _user("dir-rej@demo.iua.local", "direction")

    client = APIClient()
    client.force_authenticate(user=student)
    create = client.post(
        reverse("admin-requests-list"),
        {"kind": "transcript", "subject": "Relevé", "body": ""},
        format="json",
    )
    req_id = create.data["id"]

    client.force_authenticate(user=direction)
    reject = client.post(
        reverse("admin-requests-reject", args=[req_id]),
        {"admin_note": "Dossier incomplet"},
        format="json",
    )
    assert reject.status_code == 200, reject.data
    assert reject.data["status"] == "rejected"


@pytest.mark.django_db
def test_requester_only_sees_own(seeded):
    a = _user("a-own@demo.iua.local", "student")
    b = _user("b-own@demo.iua.local", "student")
    AdminRequest.objects.create(requester=a, kind="other", subject="A only")
    AdminRequest.objects.create(requester=b, kind="other", subject="B only")

    client = APIClient()
    client.force_authenticate(user=a)
    listing = client.get(reverse("admin-requests-list"))
    assert listing.status_code == 200
    subjects = [row["subject"] for row in listing.data["results"]]
    assert subjects == ["A only"]


@pytest.mark.django_db
def test_forbidden_transition(seeded):
    student = _user("st-tr@demo.iua.local", "student")
    admin = _user("ad-tr@demo.iua.local", "admin")
    client = APIClient()
    client.force_authenticate(user=student)
    create = client.post(
        reverse("admin-requests-list"),
        {"kind": "certificate", "subject": "Cert", "body": ""},
        format="json",
    )
    req_id = create.data["id"]

    client.force_authenticate(user=admin)
    client.post(reverse("admin-requests-approve", args=[req_id]), {}, format="json")
    # done → rejected not allowed
    bad = client.post(reverse("admin-requests-reject", args=[req_id]), {}, format="json")
    assert bad.status_code == 400
