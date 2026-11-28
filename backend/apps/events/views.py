from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import require_permission
from apps.events.models import DeadLetterEvent, OutboxMessage
from apps.events.serializers import DeadLetterSerializer, OutboxSerializer
from apps.events.services import dispatch_message


class OutboxListView(generics.ListAPIView):
    permission_classes = [require_permission("events.outbox.read")]
    required_permission = "events.outbox.read"
    serializer_class = OutboxSerializer
    queryset = OutboxMessage.objects.all().order_by("-created_at")
    filterset_fields = ("status", "event_type")


class DeadLetterListView(generics.ListAPIView):
    permission_classes = [require_permission("events.outbox.read")]
    required_permission = "events.outbox.read"
    serializer_class = DeadLetterSerializer
    queryset = DeadLetterEvent.objects.filter(resolved=False).order_by("-created_at")


class DeadLetterRetryView(APIView):
    permission_classes = [require_permission("events.outbox.write")]
    required_permission = "events.outbox.write"

    def post(self, request, pk):
        dead = DeadLetterEvent.objects.filter(pk=pk, resolved=False).first()
        if not dead:
            return Response({"code": "not_found", "message": "Dead letter introuvable."}, status=404)
        message = OutboxMessage.objects.filter(pk=dead.event_id).first()
        if not message:
            return Response({"code": "not_found", "message": "Événement source introuvable."}, status=404)
        message.status = OutboxMessage.Status.PENDING
        message.save(update_fields=["status", "updated_at"])
        dispatch_message(message)
        dead.resolved = True
        dead.save(update_fields=["resolved", "updated_at"])
        return Response({"message": "Nouvelle tentative lancée."})
