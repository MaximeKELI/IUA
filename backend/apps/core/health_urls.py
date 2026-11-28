from django.core.cache import cache
from django.db import connection
from django.http import HttpResponse, JsonResponse
from django.urls import path
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


def _db_ok() -> bool:
    try:
        connection.ensure_connection()
        return True
    except Exception:
        return False


def _cache_ok() -> bool:
    try:
        cache.set("iua_health_ping", "1", 5)
        return cache.get("iua_health_ping") == "1"
    except Exception:
        return False


def _broker_ok() -> bool | None:
    """Optional Redis/broker ping — None if unused."""
    try:
        from django.conf import settings

        url = getattr(settings, "CELERY_BROKER_URL", "") or ""
        if not url or "memory" in url or "eager" in url:
            return None
        # Cache backend often shares Redis — reuse cache ping as proxy
        return _cache_ok()
    except Exception:
        return False


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        db_ok = _db_ok()
        cache_ok = _cache_ok()
        broker = _broker_ok()
        ok = db_ok and cache_ok and (broker is not False)
        return JsonResponse(
            {
                "status": "ok" if ok else "degraded",
                "service": "iua-digital-campus",
                "database": db_ok,
                "cache": cache_ok,
                "broker": broker,
                "checks": {"db": db_ok, "cache": cache_ok, "broker": broker},
                "ts": timezone.now().isoformat(),
            },
            status=200 if ok else 503,
        )


class LivenessView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return JsonResponse({"status": "alive", "service": "iua-digital-campus"})


class ReadinessView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        db_ok = _db_ok()
        cache_ok = _cache_ok()
        ok = db_ok and cache_ok
        return JsonResponse(
            {
                "status": "ready" if ok else "not_ready",
                "checks": {"db": db_ok, "cache": cache_ok},
            },
            status=200 if ok else 503,
        )


class MetricsView(APIView):
    """Lightweight text metrics for scrapers (non-sensitive counts)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        users = pending = outbox_failed = 0
        try:
            from apps.identity.models import User

            users = User.objects.filter(is_active=True).count()
        except Exception:
            pass
        try:
            from apps.academic.models import AdminRequest

            pending = AdminRequest.objects.filter(status="pending").count()
        except Exception:
            pass
        try:
            from apps.events.models import OutboxEvent

            outbox_failed = OutboxEvent.objects.filter(status="failed").count()
        except Exception:
            pass
        body = "\n".join(
            [
                "# HELP iua_users_active Active user accounts",
                "# TYPE iua_users_active gauge",
                f"iua_users_active {users}",
                "# HELP iua_pending_requests Pending admin requests",
                "# TYPE iua_pending_requests gauge",
                f"iua_pending_requests {pending}",
                "# HELP iua_outbox_failed Failed outbox events",
                "# TYPE iua_outbox_failed gauge",
                f"iua_outbox_failed {outbox_failed}",
                "",
            ]
        )
        return HttpResponse(body, content_type="text/plain; version=0.0.4")


urlpatterns = [
    path("", HealthView.as_view(), name="health"),
    path("live/", LivenessView.as_view(), name="health-live"),
    path("ready/", ReadinessView.as_view(), name="health-ready"),
    path("metrics/", MetricsView.as_view(), name="health-metrics"),
]
