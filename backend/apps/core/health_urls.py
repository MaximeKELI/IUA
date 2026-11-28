from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        db_ok = True
        cache_ok = True
        try:
            connection.ensure_connection()
        except Exception:
            db_ok = False
        try:
            cache.set("iua_health_ping", "1", 5)
            cache_ok = cache.get("iua_health_ping") == "1"
        except Exception:
            cache_ok = False
        ok = db_ok and cache_ok
        status_code = 200 if ok else 503
        return JsonResponse(
            {
                "status": "ok" if ok else "degraded",
                "service": "iua-digital-campus",
                "database": db_ok,
                "cache": cache_ok,
                "checks": {"db": db_ok, "cache": cache_ok},
            },
            status=status_code,
        )


urlpatterns = [
    path("", HealthView.as_view(), name="health"),
]
