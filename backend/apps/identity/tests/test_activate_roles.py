import pytest
from rest_framework.test import APIClient

from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role


@pytest.mark.django_db
def test_deactivate_keeps_roles_for_reactivation():
    seed_roles_and_permissions()
    admin = User.objects.create_superuser(
        email="admin-act@test.iua.local",
        password="AdminPass2026!",
        first_name="Admin",
        last_name="Test",
    )
    assign_role(admin, "super_admin")
    target = User.objects.create_user(
        email="teacher-act@test.iua.local",
        password="TeacherPass2026!",
        first_name="Tea",
        last_name="Cher",
    )
    assign_role(target, "teacher")

    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/",
        {"email": "admin-act@test.iua.local", "password": "AdminPass2026!"},
        format="json",
    )
    assert login.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    res = client.post(f"/api/v1/users/{target.id}/deactivate/")
    assert res.status_code == 200
    target.refresh_from_db()
    assert target.is_active is False
    assert target.user_roles.filter(role__code="teacher", is_active=True).exists()

    res = client.post(f"/api/v1/users/{target.id}/activate/")
    assert res.status_code == 200
    target.refresh_from_db()
    assert target.is_active is True
    assert target.has_role("teacher")
