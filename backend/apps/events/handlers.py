"""Core cross-module event handlers for the foundation layer."""

from apps.events.models import OutboxMessage
from apps.events.registry import event_handler
from apps.notifications.services import notify_user


@event_handler("USER_ROLE_ASSIGNED")
def on_user_role_assigned(message: OutboxMessage) -> None:
    from apps.identity.models import User

    user_id = message.aggregate_id
    role = message.payload.get("role")
    user = User.objects.filter(pk=user_id).first()
    if not user:
        return
    notify_user(
        user=user,
        title="Nouveau rôle attribué",
        body=f"Le rôle « {role} » vous a été attribué sur IUA Digital Campus.",
        category="identity",
        data={"event_id": str(message.id), "role": role},
    )


@event_handler("STUDENT_REGISTERED")
def on_student_registered(message: OutboxMessage) -> None:
    from apps.identity.models import User

    email = message.payload.get("email")
    user = User.objects.filter(email=email).first() if email else None
    if not user:
        return
    notify_user(
        user=user,
        title="Bienvenue à l'IUA",
        body="Votre dossier étudiant est actif. Accédez à votre portail Digital Campus.",
        category="admissions",
        data={"event_id": str(message.id)},
    )
