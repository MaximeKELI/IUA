from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.identity.models import Permission, Role, User
from apps.identity.services import is_login_locked, record_login_attempt


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "code", "name", "module", "description")


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ("id", "code", "name", "description", "is_system", "permissions")


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "is_active",
            "mfa_enabled",
            "roles",
            "date_joined",
        )

    def get_roles(self, obj: User) -> list[str]:
        return obj.role_codes()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context["request"]
        email = attrs["email"].lower().strip()
        password = attrs["password"]

        if is_login_locked(email):
            raise serializers.ValidationError(
                "Compte temporairement verrouillé après plusieurs tentatives échouées."
            )

        user = authenticate(request=request, username=email, password=password)
        if user is None:
            record_login_attempt(email, request, successful=False)
            raise serializers.ValidationError("Email ou mot de passe incorrect.")
        if not user.is_active:
            raise serializers.ValidationError("Compte désactivé.")

        record_login_attempt(email, request, successful=True)
        attrs["user"] = user
        return attrs
