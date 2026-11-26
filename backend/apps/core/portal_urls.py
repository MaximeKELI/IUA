from django.urls import path

from apps.core.portal_views import (
    AdminDashboardView,
    DirectionDashboardView,
    StudentDashboardView,
    TeacherDashboardView,
)

urlpatterns = [
    path("student/dashboard/", StudentDashboardView.as_view(), name="portal-student"),
    path("teacher/dashboard/", TeacherDashboardView.as_view(), name="portal-teacher"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="portal-admin"),
    path("direction/dashboard/", DirectionDashboardView.as_view(), name="portal-direction"),
]
