from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.identity.privacy_views import PrivacyEraseRequestView, PrivacyExportView
from apps.identity.views import (
    CookieRefreshView,
    LoginView,
    LogoutView,
    MeView,
    MfaEnableView,
    MfaEnrollConfirmView,
    MfaEnrollSetupView,
    MfaSetupView,
    MfaVerifyView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RoleListView,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", CookieRefreshView.as_view(), name="auth-refresh"),
    path("auth/refresh/legacy/", TokenRefreshView.as_view(), name="auth-refresh-legacy"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/mfa/verify/", MfaVerifyView.as_view(), name="auth-mfa-verify"),
    path("auth/mfa/setup/", MfaSetupView.as_view(), name="auth-mfa-setup"),
    path("auth/mfa/enable/", MfaEnableView.as_view(), name="auth-mfa-enable"),
    path("auth/mfa/enroll/setup/", MfaEnrollSetupView.as_view(), name="auth-mfa-enroll-setup"),
    path("auth/mfa/enroll/confirm/", MfaEnrollConfirmView.as_view(), name="auth-mfa-enroll-confirm"),
    path("auth/password/reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path(
        "auth/password/reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
    path("privacy/export/", PrivacyExportView.as_view(), name="privacy-export"),
    path("privacy/erase-request/", PrivacyEraseRequestView.as_view(), name="privacy-erase"),
    path("roles/", RoleListView.as_view(), name="roles-list"),
    path("", include(router.urls)),
]
