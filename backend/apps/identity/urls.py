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
    MfaSetupView,
    MfaVerifyView,
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
    path("privacy/export/", PrivacyExportView.as_view(), name="privacy-export"),
    path("privacy/erase-request/", PrivacyEraseRequestView.as_view(), name="privacy-erase"),
    path("roles/", RoleListView.as_view(), name="roles-list"),
    path("", include(router.urls)),
]
