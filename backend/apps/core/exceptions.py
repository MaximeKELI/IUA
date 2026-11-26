import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("iua.api")


def iua_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API error in %s", context.get("view"))
        return Response(
            {
                "code": "server_error",
                "message": "Une erreur interne est survenue.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    message = response.data
    if isinstance(message, dict) and "detail" in message:
        detail = message["detail"]
        payload = {
            "code": getattr(exc, "default_code", "error"),
            "message": str(detail),
            "details": message,
        }
    elif isinstance(message, dict):
        # Surface first field error for admin UX
        first = next(iter(message.values()), None)
        if isinstance(first, list) and first:
            human = str(first[0])
        elif isinstance(first, str):
            human = first
        else:
            human = "La requête est invalide."
        payload = {
            "code": getattr(exc, "default_code", "invalid"),
            "message": human,
            "details": message,
        }
    else:
        payload = {
            "code": getattr(exc, "default_code", "error"),
            "message": "La requête est invalide.",
            "details": message,
        }
    response.data = payload
    return response
