"""HttpOnly JWT cookie authentication + cookie helpers."""

from __future__ import annotations

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


ACCESS_COOKIE = getattr(settings, "JWT_ACCESS_COOKIE", "iua_access")
REFRESH_COOKIE = getattr(settings, "JWT_REFRESH_COOKIE", "iua_refresh")
CSRF_COOKIE = getattr(settings, "JWT_CSRF_COOKIE", "iua_csrf")


class CookieJWTAuthentication(JWTAuthentication):
    """Prefer Authorization header; fall back to HttpOnly access cookie."""

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            return super().authenticate(request)
        raw = request.COOKIES.get(ACCESS_COOKIE)
        if not raw:
            return None
        try:
            validated = AccessToken(raw)
            return self.get_user(validated), validated
        except (InvalidToken, TokenError, Exception):
            return None


def _cookie_kwargs(*, max_age: int) -> dict:
    secure = not settings.DEBUG
    return {
        "httponly": True,
        "secure": secure,
        "samesite": "Lax",
        "path": "/",
        "max_age": max_age,
    }


def set_jwt_cookies(response, access: str, refresh: str) -> None:
    access_age = int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())
    refresh_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
    response.set_cookie(ACCESS_COOKIE, access, **_cookie_kwargs(max_age=access_age))
    response.set_cookie(REFRESH_COOKIE, refresh, **_cookie_kwargs(max_age=refresh_age))
    # Double-submit CSRF token (readable by JS, compared to header on mutations)
    import secrets

    csrf = secrets.token_urlsafe(32)
    response.set_cookie(
        CSRF_COOKIE,
        csrf,
        httponly=False,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/",
        max_age=refresh_age,
    )
    response["X-IUA-CSRF"] = csrf


def clear_jwt_cookies(response) -> None:
    for name in (ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE):
        response.delete_cookie(name, path="/")
