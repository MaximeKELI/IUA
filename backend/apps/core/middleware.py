import logging

logger = logging.getLogger("iua.request")


class RequestAuditMiddleware:
    """Lightweight request logging for sensitive path prefixes."""

    SENSITIVE_PREFIXES = ("/api/v1/finance/", "/api/v1/grades/", "/api/v1/auth/")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        path = request.path
        if any(path.startswith(prefix) for prefix in self.SENSITIVE_PREFIXES):
            user = getattr(request, "user", None)
            logger.info(
                "path=%s method=%s status=%s user=%s",
                path,
                request.method,
                response.status_code,
                getattr(user, "pk", None),
            )
        return response
