import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.cookie_auth import ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE
from apps.identity.models import User
from apps.identity.services import assign_role


@pytest.fixture
def seeded(db):
    seed_roles_and_permissions()


def _user(email, role):
    u = User.objects.create_user(
        email=email, password="SecurePass123!", first_name="A", last_name="B"
    )
    assign_role(u, role)
    return u


@pytest.mark.django_db
def test_login_sets_httponly_cookies(seeded):
    _user("cook@demo.iua.local", "student")
    client = APIClient()
    res = client.post(
        reverse("auth-login"),
        {"email": "cook@demo.iua.local", "password": "SecurePass123!"},
        format="json",
    )
    assert res.status_code == 200
    assert ACCESS_COOKIE in res.cookies
    assert REFRESH_COOKIE in res.cookies
    assert CSRF_COOKIE in res.cookies
    assert res.cookies[ACCESS_COOKIE]["httponly"]
    assert res.cookies[REFRESH_COOKIE]["httponly"]
    # Morsel stores absent httponly as '' (not False)
    assert not res.cookies[CSRF_COOKIE]["httponly"]


@pytest.mark.django_db
def test_cookie_auth_me_without_bearer(seeded):
    _user("cook2@demo.iua.local", "student")
    client = APIClient()
    login = client.post(
        reverse("auth-login"),
        {"email": "cook2@demo.iua.local", "password": "SecurePass123!"},
        format="json",
    )
    assert login.status_code == 200
    # New client with cookies only — no Authorization header
    c2 = APIClient()
    c2.cookies = login.cookies
    me = c2.get(reverse("auth-me"))
    assert me.status_code == 200, me.data
    assert me.data["email"] == "cook2@demo.iua.local"


@pytest.mark.django_db
def test_logout_clears_cookies(seeded):
    _user("out@demo.iua.local", "student")
    client = APIClient()
    login = client.post(
        reverse("auth-login"),
        {"email": "out@demo.iua.local", "password": "SecurePass123!"},
        format="json",
    )
    assert login.status_code == 200
    client.cookies = login.cookies
    csrf = login.cookies[CSRF_COOKIE].value
    out = client.post(
        reverse("auth-logout"),
        {},
        format="json",
        HTTP_X_IUA_CSRF=csrf,
    )
    assert out.status_code == 200, out.content
    assert out.cookies[ACCESS_COOKIE].value == ""


@pytest.mark.django_db
def test_teaching_assignments_hidden_from_bare_user(seeded):
    visitor = _user("vis@demo.iua.local", "partner")
    client = APIClient()
    client.force_authenticate(user=visitor)
    res = client.get(reverse("teaching-assignments-list"))
    assert res.status_code == 200
    assert res.data.get("results", res.data) == [] or res.data.get("count") == 0


@pytest.mark.django_db
def test_privacy_export(seeded):
    user = _user("dpo@demo.iua.local", "student")
    client = APIClient()
    client.force_authenticate(user=user)
    res = client.get(reverse("privacy-export"))
    assert res.status_code == 200
    assert res.data["subject"]["email"] == "dpo@demo.iua.local"
    assert "retention_note" in res.data
