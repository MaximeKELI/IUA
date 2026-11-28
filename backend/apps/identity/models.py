import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.models import SoftDeleteModel, TimeStampedModel, UUIDModel
from apps.identity.managers import UserManager


class Permission(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=128, unique=True)
    name = models.CharField(max_length=255)
    module = models.CharField(max_length=64)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["module", "code"]

    def __str__(self) -> str:
        return self.code


class Role(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=True)
    permissions = models.ManyToManyField(Permission, blank=True, related_name="roles")

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


def user_avatar_path(instance: "User", filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    return f"avatars/{instance.pk}.{ext}"


class User(AbstractBaseUser, PermissionsMixin, UUIDModel):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to=user_avatar_path, blank=True, null=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True)
    must_change_password = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def has_perm_code(self, code: str) -> bool:
        if self.is_superuser:
            return True
        return Permission.objects.filter(
            roles__user_roles__user=self,
            roles__user_roles__is_active=True,
            code=code,
        ).exists()

    def permission_codes(self) -> list[str]:
        if self.is_superuser:
            return list(Permission.objects.values_list("code", flat=True))
        return list(
            Permission.objects.filter(
                roles__user_roles__user=self,
                roles__user_roles__is_active=True,
            )
            .distinct()
            .values_list("code", flat=True)
        )

    def has_role(self, code: str) -> bool:
        if self.is_superuser and code == "super_admin":
            return True
        return self.user_roles.filter(role__code=code, is_active=True).exists()

    def has_any_role(self, *codes: str) -> bool:
        if self.is_superuser:
            return True
        return self.user_roles.filter(role__code__in=codes, is_active=True).exists()

    def role_codes(self) -> list[str]:
        return list(self.user_roles.filter(is_active=True).values_list("role__code", flat=True))


class UserRole(UUIDModel, TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="user_roles")
    faculty_id = models.UUIDField(null=True, blank=True)
    program_id = models.UUIDField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "role", "faculty_id", "program_id")
        indexes = [models.Index(fields=["user", "role", "is_active"])]


class LoginAttempt(UUIDModel):
    email = models.EmailField(db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    successful = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "successful", "created_at"]),
            models.Index(fields=["ip_address", "created_at"]),
        ]


class PersonProfile(UUIDModel, TimeStampedModel, SoftDeleteModel):
    """Shared PII profile linked 1-1 to a user account."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="person")
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=32, blank=True)
    nationality = models.CharField(max_length=64, blank=True, default="Ivoirienne")
    address = models.TextField(blank=True)
    city = models.CharField(max_length=128, blank=True)
    country = models.CharField(max_length=64, blank=True, default="Côte d'Ivoire")
    id_document_type = models.CharField(max_length=64, blank=True)
    id_document_number_hash = models.CharField(max_length=128, blank=True)

    def __str__(self) -> str:
        return f"Person<{self.user.email}>"
