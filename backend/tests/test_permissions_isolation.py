import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.academic.models import Faculty, Institution, StudentProfile
from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role


@pytest.mark.django_db
def test_student_only_sees_own_profile():
    seed_roles_and_permissions()
    institution = Institution.objects.create(code="IUA", name="IUA")
    faculty = Faculty.objects.create(institution=institution, code="F1", name="Fac 1")

    a = User.objects.create_user(email="a@demo.iua.local", password="SecurePass123!", first_name="A", last_name="A")
    b = User.objects.create_user(email="b@demo.iua.local", password="SecurePass123!", first_name="B", last_name="B")
    assign_role(a, "student")
    assign_role(b, "student")
    StudentProfile.objects.create(user=a, student_number="S1")
    StudentProfile.objects.create(user=b, student_number="S2")

    client = APIClient()
    client.force_authenticate(user=a)
    response = client.get(reverse("students-list"))
    assert response.status_code == 200
    numbers = [row["student_number"] for row in response.data["results"]]
    assert numbers == ["S1"]
