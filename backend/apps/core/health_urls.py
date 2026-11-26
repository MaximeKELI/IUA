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
        try:
            connection.ensure_connection()
        except Exception:
            db_ok = False
        status_code = 200 if db_ok else 503
        return JsonResponse(
            {
                "status": "ok" if db_ok else "degraded",
                "service": "iua-digital-campus",
                "database": db_ok,
            },
            status=status_code,
        )


urlpatterns = [
    path("", HealthView.as_view(), name="health"),
]
