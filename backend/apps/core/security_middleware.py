"""Extra security headers + CSRF double-submit for cookie JWT mutations."""

from django.conf import settings


SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


class ExtremeSecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Cookie CSRF: mutating requests with access cookie must send matching header.
        # Always enforce when cookie auth is used (including DEBUG) — extreme posture.
        if request.method not in SAFE_METHODS:
            access = request.COOKIES.get(getattr(settings, "JWT_ACCESS_COOKIE", "iua_access"))
            if access and not request.headers.get("Authorization"):
                csrf_cookie = request.COOKIES.get(getattr(settings, "JWT_CSRF_COOKIE", "iua_csrf"))
                csrf_header = request.headers.get("X-IUA-CSRF") or request.headers.get("x-iua-csrf")
                if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                    from django.http import JsonResponse

                    return JsonResponse(
                        {"code": "csrf", "message": "Jeton CSRF manquant ou invalide."},
                        status=403,
                    )

        response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        response["Cross-Origin-Opener-Policy"] = "same-origin"
        response["Cross-Origin-Resource-Policy"] = "same-site"
        if not settings.DEBUG:
            response["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            csp = (
                "default-src 'none'; "
                "frame-ancestors 'none'; "
                "base-uri 'none'; "
                "form-action 'self'"
            )
            # API responses: restrictive CSP (browsers ignore for XHR JSON mostly)
            response.setdefault("Content-Security-Policy", csp)
        return response
