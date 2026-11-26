from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.permissions import require_permission
from apps.identity.models import Role, User
from apps.identity.serializers import LoginSerializer, RoleSerializer, UserSerializer
from apps.identity.services import client_ip


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user: User = serializer.validated_data["user"]
        user.last_login = timezone.now()
        user.last_login_ip = client_ip(request)
        user.save(update_fields=["last_login", "last_login_ip"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"code": "invalid", "message": "Le token refresh est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response(
                {"code": "invalid", "message": "Token refresh invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Déconnexion réussie."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListView(generics.ListAPIView):
    permission_classes = [require_permission("identity.user.read")]
    required_permission = "identity.user.read"
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("last_name", "first_name")
    search_fields = ("email", "first_name", "last_name")


class RoleListView(generics.ListAPIView):
    permission_classes = [require_permission("identity.role.read")]
    required_permission = "identity.role.read"
    serializer_class = RoleSerializer
    queryset = Role.objects.prefetch_related("permissions").all()
