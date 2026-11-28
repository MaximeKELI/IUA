from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.identity.views import (
    LoginView,
    LogoutView,
    MeView,
    MfaEnableView,
    MfaSetupView,
    MfaVerifyView,
    RoleListView,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/mfa/verify/", MfaVerifyView.as_view(), name="auth-mfa-verify"),
    path("auth/mfa/setup/", MfaSetupView.as_view(), name="auth-mfa-setup"),
    path("auth/mfa/enable/", MfaEnableView.as_view(), name="auth-mfa-enable"),
    path("roles/", RoleListView.as_view(), name="roles-list"),
    path("", include(router.urls)),
]
