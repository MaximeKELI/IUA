import pytest
from rest_framework.test import APIClient

from apps.academic.models import Faculty, Institution, Program
from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role


@pytest.mark.django_db
def test_admin_can_provision_student():
    seed_roles_and_permissions()
    admin = User.objects.create_superuser(
        email="boss@test.iua.local",
        password="TestPass123!",
        first_name="Boss",
        last_name="IUA",
    )
    assign_role(admin, "super_admin")

    institution = Institution.objects.create(code="IUA-T", name="IUA Test")
    faculty = Faculty.objects.create(institution=institution, code="F1", name="Fac Test")
    program = Program.objects.create(faculty=faculty, code="L-TEST", name="Licence Test")

    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/",
        {"email": "boss@test.iua.local", "password": "TestPass123!"},
        format="json",
    )
    assert login.status_code == 200
    token = login.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    res = client.post(
        "/api/v1/users/",
        {
            "email": "nouveau@test.iua.local",
            "password": "StudentPass2026!",
            "first_name": "Nadine",
            "last_name": "Koffi",
            "roles": ["student"],
            "level": "L1",
            "program_id": str(program.id),
        },
        format="json",
    )
    assert res.status_code == 201, res.data
    assert res.data["email"] == "nouveau@test.iua.local"
    assert "student" in res.data["roles"]

    created = User.objects.get(email="nouveau@test.iua.local")
    assert hasattr(created, "student_profile")
    assert created.student_profile.program_id == program.id
