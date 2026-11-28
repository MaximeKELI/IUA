from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.admissions.models import AdmissionApplication
from apps.admissions.serializers import AdmissionApplicationSerializer, AdmissionReviewSerializer
from apps.core.permissions import require_permission


class AdmissionCreateThrottle(AnonRateThrottle):
    scope = "admission"
    rate = "10/hour"


class AdmissionApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = AdmissionApplicationSerializer
    queryset = AdmissionApplication.objects.all()
    http_method_names = ["get", "post", "head", "options"]
    filterset_fields = ("status", "country")
    search_fields = ("email", "passport", "program", "nationality")
    ordering_fields = ("created_at", "status")

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action in ("list", "retrieve", "review"):
            return [require_permission("services.request.manage")()]
        return [IsAuthenticated()]

    def get_throttles(self):
        if self.action == "create":
            return [AdmissionCreateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        app = serializer.save(status=AdmissionApplication.Status.SUBMITTED)
        try:
            from apps.teaching.ops_views import log_audit

            log_audit(None, "admission.submitted", "AdmissionApplication", f"{app.email} ({app.id})")
        except Exception:
            import logging

            logging.getLogger("iua.audit").exception("admission audit failed")
        return Response(AdmissionApplicationSerializer(app).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        app = self.get_object()
        ser = AdmissionReviewSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        app.status = ser.validated_data["status"]
        if "staff_note" in ser.validated_data:
            app.staff_note = ser.validated_data["staff_note"]
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.save()
        try:
            from apps.teaching.ops_views import log_audit

            log_audit(
                request.user,
                f"admission.{app.status}",
                "AdmissionApplication",
                f"{app.email} ({app.id})",
            )
        except Exception:
            import logging

            logging.getLogger("iua.audit").exception("admission review audit failed")
        return Response(AdmissionApplicationSerializer(app).data)
