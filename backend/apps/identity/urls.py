from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.identity.views import LoginView, LogoutView, MeView, RoleListView, UserListView

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("users/", UserListView.as_view(), name="users-list"),
    path("roles/", RoleListView.as_view(), name="roles-list"),
]
