"""Authenticated media delivery — do not expose /media as public static in production."""

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def protected_media(request, path: str):
    """Serve media files only to authenticated users (avatars, uploads)."""
    root = Path(settings.MEDIA_ROOT).resolve()
    target = (root / path).resolve()
    if not str(target).startswith(str(root)) or not target.is_file():
        raise Http404()
    # Avatars: owner or staff
    if "avatars" in path.replace("\\", "/"):
        user = request.user
        if not (
            user.is_superuser
            or user.has_any_role("admin", "secretariat", "super_admin", "direction")
            or (user.avatar and path in str(user.avatar.name))
        ):
            # Allow self avatar path match loosely
            if not (user.avatar and Path(user.avatar.name).name == target.name):
                raise Http404()
    return FileResponse(target.open("rb"), as_attachment=False)
