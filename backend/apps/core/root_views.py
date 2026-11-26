from django.http import JsonResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView


class RootView(APIView):
    """Orientation page for the API host (UI lives on Next.js)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return JsonResponse(
            {
                "service": "IUA Digital Campus API",
                "status": "ok",
                "docs": "/api/docs/",
                "schema": "/api/schema/",
                "api": "/api/v1/",
                "health": "/api/v1/health/",
                "frontend": "http://localhost:3000",
                "message": "L'interface utilisateur est servie par Next.js, pas par Django.",
            }
        )
