import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def student(db):
    seed_roles_and_permissions()
    user = User.objects.create_user(
        email="stu@demo.iua.local",
        password="SecurePass123!",
        first_name="Test",
        last_name="Student",
    )
    assign_role(user, "student")
    return user


@pytest.mark.django_db
def test_login_success(api, student):
    response = api.post(
        reverse("auth-login"),
        {"email": "stu@demo.iua.local", "password": "SecurePass123!"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert response.data["user"]["email"] == "stu@demo.iua.local"
    assert "student" in response.data["user"]["roles"]


@pytest.mark.django_db
def test_login_failure(api, student):
    response = api.post(
        reverse("auth-login"),
        {"email": "stu@demo.iua.local", "password": "wrong-password"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_me_requires_auth(api):
    response = api.get(reverse("auth-me"))
    assert response.status_code in (401, 403)


@pytest.mark.django_db
def test_student_cannot_access_direction_dashboard(api, student):
    api.force_authenticate(user=student)
    response = api.get(reverse("portal-direction"))
    assert response.status_code == 403
