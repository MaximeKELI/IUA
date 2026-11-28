from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.permissions import require_permission
from apps.identity.models import Role, User
from apps.identity.serializers import (
    LoginSerializer,
    RoleSerializer,
    UserProvisionSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from apps.identity.services import client_ip


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


def _auth_response(user: User, request):
    from django.conf import settings

    from apps.identity.cookie_auth import set_jwt_cookies

    user.last_login = timezone.now()
    user.last_login_ip = client_ip(request)
    user.save(update_fields=["last_login", "last_login_ip"])
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    refresh_s = str(refresh)
    body = {
        "user": UserSerializer(user, context={"request": request}).data,
        "cookie_auth": True,
    }
    if getattr(settings, "IUA_EXPOSE_TOKENS_IN_BODY", True):
        body["access"] = access
        body["refresh"] = refresh_s
    response = Response(body)
    set_jwt_cookies(response, access, refresh_s)
    return response


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        from apps.identity.mfa import (
            issue_mfa_token,
            user_must_enroll_mfa,
            user_needs_mfa_challenge,
        )

        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user: User = serializer.validated_data["user"]

        if user_must_enroll_mfa(user):
            from apps.identity.mfa import issue_mfa_enroll_token

            return Response(
                {
                    "mfa_enrollment_required": True,
                    "mfa_enrollment_token": issue_mfa_enroll_token(user.id),
                    "message": "L'inscription MFA est obligatoire pour ce grade.",
                    "user": {"id": str(user.id), "email": user.email, "roles": user.role_codes()},
                },
                status=status.HTTP_200_OK,
            )

        if user_needs_mfa_challenge(user):
            return Response(
                {
                    "mfa_required": True,
                    "mfa_token": issue_mfa_token(user.id),
                    "message": "Code TOTP requis.",
                }
            )

        return _auth_response(user, request)


class MfaVerifyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        from apps.identity.mfa import parse_mfa_token, verify_totp

        token = request.data.get("mfa_token") or ""
        code = request.data.get("code") or ""
        uid = parse_mfa_token(token)
        if not uid:
            return Response(
                {"code": "invalid", "message": "Jeton MFA invalide ou expiré."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(pk=uid, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"code": "invalid", "message": "Utilisateur introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not verify_totp(user.mfa_secret, code):
            return Response(
                {"code": "invalid", "message": "Code TOTP incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return _auth_response(user, request)


class MfaSetupView(APIView):
    """Generate a new TOTP secret (not enabled until confirm)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.identity.mfa import new_totp_secret, provisioning_uri

        secret = new_totp_secret()
        request.user.mfa_secret = secret
        request.user.mfa_enabled = False
        request.user.save(update_fields=["mfa_secret", "mfa_enabled"])
        return Response(
            {
                "secret": secret,
                "otpauth_uri": provisioning_uri(secret, request.user.email),
                "message": "Scannez le secret puis confirmez avec POST /auth/mfa/enable/.",
            }
        )


class MfaEnableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.identity.mfa import verify_totp

        code = request.data.get("code") or ""
        if not request.user.mfa_secret:
            return Response(
                {"code": "invalid", "message": "Appelez d'abord /auth/mfa/setup/."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not verify_totp(request.user.mfa_secret, code):
            return Response(
                {"code": "invalid", "message": "Code TOTP incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.mfa_enabled = True
        request.user.save(update_fields=["mfa_enabled"])
        return Response({"mfa_enabled": True, "message": "MFA activé."})


class MfaEnrollSetupView(APIView):
    """Pre-auth MFA enrollment setup using short-lived enroll token."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        from apps.identity.mfa import new_totp_secret, parse_mfa_enroll_token, provisioning_uri

        token = request.data.get("mfa_enrollment_token") or ""
        uid = parse_mfa_enroll_token(token)
        if not uid:
            return Response(
                {"code": "invalid", "message": "Jeton d'inscription MFA invalide ou expiré."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(pk=uid, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"code": "invalid", "message": "Utilisateur introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = new_totp_secret()
        user.mfa_secret = secret
        user.mfa_enabled = False
        user.save(update_fields=["mfa_secret", "mfa_enabled"])
        return Response(
            {
                "secret": secret,
                "otpauth_uri": provisioning_uri(secret, user.email),
                "mfa_enrollment_token": token,
            }
        )


class MfaEnrollConfirmView(APIView):
    """Confirm TOTP during forced enrollment, then issue session cookies."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        from apps.identity.mfa import parse_mfa_enroll_token, verify_totp

        token = request.data.get("mfa_enrollment_token") or ""
        code = request.data.get("code") or ""
        uid = parse_mfa_enroll_token(token)
        if not uid:
            return Response(
                {"code": "invalid", "message": "Jeton d'inscription MFA invalide ou expiré."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(pk=uid, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"code": "invalid", "message": "Utilisateur introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.mfa_secret or not verify_totp(user.mfa_secret, code):
            return Response(
                {"code": "invalid", "message": "Code TOTP incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.mfa_enabled = True
        user.save(update_fields=["mfa_enabled"])
        return _auth_response(user, request)


class PasswordResetRequestView(APIView):
    """Always return 200 to avoid email enumeration."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.core.mail import send_mail

        email = (request.data.get("email") or "").strip().lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            from django.conf import settings
            import logging

            token = PasswordResetTokenGenerator().make_token(user)
            uid = str(user.pk)
            locale = getattr(settings, "FRONTEND_DEFAULT_LOCALE", "fr")
            origin = getattr(settings, "FRONTEND_ORIGIN", "http://127.0.0.1:3000").rstrip("/")
            reset_url = f"{origin}/{locale}/connexion?reset={uid}:{token}"
            try:
                send_mail(
                    subject="IUA — Réinitialisation du mot de passe",
                    message=(
                        f"Bonjour,\n\nPour réinitialiser votre mot de passe IUA, "
                        f"ouvrez : {reset_url}\n\nSi vous n'êtes pas à l'origine de cette "
                        f"demande, ignorez cet e-mail."
                    ),
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                logging.getLogger("iua.auth").exception(
                    "password reset email failed for user_id=%s", uid
                )
        return Response(
            {
                "message": "Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé."
            }
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        from django.contrib.auth.password_validation import validate_password
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.core.exceptions import ValidationError

        uid = request.data.get("uid") or ""
        token = request.data.get("token") or ""
        password = request.data.get("password") or ""
        try:
            user = User.objects.get(pk=uid, is_active=True)
        except (User.DoesNotExist, ValueError, ValidationError):
            return Response(
                {"code": "invalid", "message": "Lien de réinitialisation invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response(
                {"code": "invalid", "message": "Lien de réinitialisation invalide ou expiré."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(password, user=user)
        except ValidationError as exc:
            return Response(
                {"code": "invalid", "message": " ".join(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"message": "Mot de passe mis à jour. Vous pouvez vous connecter."})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.identity.cookie_auth import REFRESH_COOKIE, clear_jwt_cookies

        refresh = request.data.get("refresh") or request.COOKIES.get(REFRESH_COOKIE)
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                pass
        response = Response({"message": "Déconnexion réussie."})
        clear_jwt_cookies(response)
        return response


class CookieRefreshView(APIView):
    """Refresh access token using HttpOnly refresh cookie (or body)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from apps.identity.cookie_auth import REFRESH_COOKIE, set_jwt_cookies
        from django.conf import settings

        raw = request.data.get("refresh") or request.COOKIES.get(REFRESH_COOKIE)
        if not raw:
            return Response(
                {"code": "invalid", "message": "Refresh token manquant."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            old = RefreshToken(raw)
            user_id = old.get("user_id")
            user = User.objects.get(pk=user_id, is_active=True)
            old.blacklist()
        except Exception:
            return Response(
                {"code": "invalid", "message": "Refresh token invalide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        new_refresh = RefreshToken.for_user(user)
        access = str(new_refresh.access_token)
        refresh_s = str(new_refresh)
        body: dict = {"cookie_auth": True}
        if getattr(settings, "IUA_EXPOSE_TOKENS_IN_BODY", True):
            body["access"] = access
            body["refresh"] = refresh_s
        response = Response(body)
        set_jwt_cookies(response, access, refresh_s)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        """Update own profile fields and/or avatar (multipart)."""
        user: User = request.user
        updated: list[str] = []
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        phone = request.data.get("phone")
        if first_name is not None:
            user.first_name = str(first_name).strip()[:150]
            updated.append("first_name")
        if last_name is not None:
            user.last_name = str(last_name).strip()[:150]
            updated.append("last_name")
        if phone is not None:
            user.phone = str(phone).strip()[:32]
            updated.append("phone")
        avatar = request.FILES.get("avatar")
        if avatar is not None:
            if avatar.size > 2 * 1024 * 1024:
                return Response(
                    {"code": "invalid", "message": "Photo trop lourde (max 2 Mo)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            content_type = getattr(avatar, "content_type", "") or ""
            if not content_type.startswith("image/"):
                return Response(
                    {"code": "invalid", "message": "Fichier image requis (JPG/PNG/WebP)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            header = avatar.read(12)
            avatar.seek(0)
            is_jpeg = header[:3] == b"\xff\xd8\xff"
            is_png = header[:8] == b"\x89PNG\r\n\x1a\n"
            is_webp = header[:4] == b"RIFF" and header[8:12] == b"WEBP"
            if not (is_jpeg or is_png or is_webp):
                return Response(
                    {"code": "invalid", "message": "Signature fichier invalide (JPG/PNG/WebP uniquement)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user.avatar:
                user.avatar.delete(save=False)
            user.avatar = avatar
            updated.append("avatar")
        if not updated:
            return Response(
                {"code": "invalid", "message": "Aucun champ à mettre à jour."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.save(update_fields=updated)
        return Response(UserSerializer(user, context={"request": request}).data)


class UserViewSet(viewsets.ModelViewSet):
    """Admin user directory: list, create, update, deactivate (no hard delete)."""

    queryset = User.objects.prefetch_related("user_roles__role").all()
    search_fields = ("email", "first_name", "last_name", "phone")
    filterset_fields = ("is_active",)
    ordering_fields = ("last_name", "first_name", "email", "date_joined")
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [require_permission("identity.user.read")()]
        return [require_permission("identity.user.manage")()]

    def get_serializer_class(self):
        if self.action == "create":
            return UserProvisionSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
            context={**self.get_serializer_context(), "updating_user": instance},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.pk == request.user.pk:
            return Response(
                {"code": "invalid", "message": "Vous ne pouvez pas désactiver votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Keep roles intact so reactivation restores access immediately.
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        # Heal legacy deactivations that wiped role flags.
        if not user.user_roles.filter(is_active=True).exists():
            user.user_roles.update(is_active=True)
        return Response(UserSerializer(user).data)


class RoleListView(generics.ListAPIView):
    permission_classes = [require_permission("identity.role.read")]
    required_permission = "identity.role.read"
    serializer_class = RoleSerializer
    queryset = Role.objects.prefetch_related("permissions").all()
    pagination_class = None
    search_fields = ("code", "name")
