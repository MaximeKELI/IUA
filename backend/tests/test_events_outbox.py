import pytest

from apps.events.models import OutboxMessage, ProcessedEvent
from apps.events.services import emit_event, relay_pending
from apps.identity.bootstrap import seed_roles_and_permissions
from apps.identity.models import User
from apps.identity.services import assign_role
from apps.notifications.models import Notification


@pytest.mark.django_db
def test_outbox_relay_creates_notification():
    seed_roles_and_permissions()
    user = User.objects.create_user(
        email="evt@demo.iua.local",
        password="SecurePass123!",
        first_name="Eve",
        last_name="Nts",
    )
    assign_role(user, "student")
    assert OutboxMessage.objects.filter(event_type="USER_ROLE_ASSIGNED").exists()

    processed = relay_pending()
    assert processed >= 1

    msg = OutboxMessage.objects.filter(event_type="USER_ROLE_ASSIGNED").latest("created_at")
    assert msg.status == OutboxMessage.Status.PUBLISHED
    assert ProcessedEvent.objects.filter(event_id=msg.id).exists()
    assert Notification.objects.filter(recipient=user, category="identity").exists()


@pytest.mark.django_db
def test_handler_idempotence():
    seed_roles_and_permissions()
    user = User.objects.create_user(
        email="idem@demo.iua.local",
        password="SecurePass123!",
        first_name="Idem",
        last_name="Potent",
    )
    message = emit_event(
        event_type="STUDENT_REGISTERED",
        aggregate_type="StudentProfile",
        aggregate_id="demo",
        payload={"email": user.email},
        source="test",
    )
    relay_pending()
    count_after_first = Notification.objects.filter(recipient=user).count()
    message.status = OutboxMessage.Status.PENDING
    message.save(update_fields=["status"])
    # Clear published state but keep ProcessedEvent → second relay must not duplicate
    from apps.events.services import dispatch_message

    dispatch_message(message)
    assert Notification.objects.filter(recipient=user).count() == count_after_first
