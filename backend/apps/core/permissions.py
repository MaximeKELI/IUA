from rest_framework.permissions import BasePermission


class HasPermission(BasePermission):
    """Check a named permission code on the authenticated user."""

    permission_code: str = ""

    def has_permission(self, request, view):
        code = getattr(view, "required_permission", None) or self.permission_code
        if not code:
            return bool(request.user and request.user.is_authenticated)
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.has_perm_code(code)


def require_permission(code: str):
    class _Perm(HasPermission):
        permission_code = code

    return _Perm
