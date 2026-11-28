from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.identity.models import Permission, Role, User
from apps.identity.provision import provision_user
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
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "avatar_url",
            "is_active",
            "mfa_enabled",
            "roles",
            "date_joined",
        )

    def get_roles(self, obj: User) -> list[str]:
        return obj.role_codes()

    def get_avatar_url(self, obj: User) -> str | None:
        if not obj.avatar:
            return None
        try:
            url = obj.avatar.url
        except ValueError:
            return None
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class UserProvisionSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=10)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    roles = serializers.ListField(child=serializers.CharField(), min_length=1)
    is_active = serializers.BooleanField(default=True)
    student_number = serializers.CharField(required=False, allow_blank=True, max_length=32)
    program_id = serializers.UUIDField(required=False, allow_null=True)
    cohort_id = serializers.UUIDField(required=False, allow_null=True)
    level = serializers.CharField(required=False, allow_blank=True, max_length=32)
    staff_number = serializers.CharField(required=False, allow_blank=True, max_length=32)
    title = serializers.CharField(required=False, allow_blank=True, max_length=128)

    def validate_roles(self, value):
        codes = [c.strip() for c in value if c and c.strip()]
        if not codes:
            raise serializers.ValidationError("Au moins un rôle est requis.")
        existing = set(Role.objects.filter(code__in=codes).values_list("code", flat=True))
        missing = sorted(set(codes) - existing)
        if missing:
            raise serializers.ValidationError(f"Rôles inconnus : {', '.join(missing)}")
        return codes

    def validate_password(self, value):
        if not value:
            return value
        try:
            password_validation.validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def validate_email(self, value):
        email = value.lower().strip()
        qs = User.objects.filter(email=email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        elif self.context.get("updating_user"):
            qs = qs.exclude(pk=self.context["updating_user"].pk)
        if qs.exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return email

    def validate(self, attrs):
        roles = attrs.get("roles") or []
        if "student" in roles and not attrs.get("program_id"):
            # Allow update that keeps existing program, but creation needs one.
            updating = self.instance or self.context.get("updating_user")
            has_program = False
            if updating is not None:
                profile = getattr(updating, "student_profile", None)
                has_program = bool(getattr(profile, "program_id", None))
            if not has_program:
                raise serializers.ValidationError(
                    {"program_id": "Une formation est obligatoire pour un étudiant."}
                )
        return attrs

    def create(self, validated_data):
        return provision_user(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "") or ""
        return provision_user(
            user=instance,
            email=validated_data.get("email", instance.email),
            password=password,
            first_name=validated_data.get("first_name", instance.first_name),
            last_name=validated_data.get("last_name", instance.last_name),
            phone=validated_data.get("phone", instance.phone),
            roles=validated_data.get("roles", instance.role_codes()),
            is_active=validated_data.get("is_active", instance.is_active),
            student_number=validated_data.get("student_number") or None,
            program_id=str(validated_data["program_id"]) if validated_data.get("program_id") else None,
            cohort_id=str(validated_data["cohort_id"]) if validated_data.get("cohort_id") else None,
            level=validated_data.get("level", ""),
            staff_number=validated_data.get("staff_number") or None,
            title=validated_data.get("title", ""),
        )


class UserUpdateSerializer(UserProvisionSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, min_length=10
    )


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
