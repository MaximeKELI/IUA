from django.conf import settings
from django.db import models

from apps.core.models import SoftDeleteModel, TimeStampedModel, UUIDModel


class Institution(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=64, blank=True)
    country = models.CharField(max_length=64, default="Côte d'Ivoire")
    city = models.CharField(max_length=128, default="Abidjan")
    address = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=64, blank=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class Faculty(UUIDModel, TimeStampedModel):
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="faculties")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("institution", "code")
        verbose_name_plural = "Faculties"

    def __str__(self) -> str:
        return self.name


class Department(UUIDModel, TimeStampedModel):
    faculty = models.ForeignKey(Faculty, on_delete=models.PROTECT, related_name="departments")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("faculty", "code")

    def __str__(self) -> str:
        return self.name


class Program(UUIDModel, TimeStampedModel):
    class DegreeLevel(models.TextChoices):
        LICENSE = "license", "Licence"
        MASTER = "master", "Master"
        DOCTORATE = "doctorate", "Doctorat"
        CERTIFICATE = "certificate", "Certificat"
        OTHER = "other", "Autre"

    faculty = models.ForeignKey(Faculty, on_delete=models.PROTECT, related_name="programs")
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="programs"
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255)
    degree_level = models.CharField(max_length=32, choices=DegreeLevel.choices, default=DegreeLevel.LICENSE)
    duration_years = models.PositiveSmallIntegerField(default=3)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("faculty", "code")

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class AcademicYear(UUIDModel, TimeStampedModel):
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="academic_years")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=64)
    starts_on = models.DateField()
    ends_on = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = ("institution", "code")
        ordering = ["-starts_on"]

    def __str__(self) -> str:
        return self.name


class Cohort(UUIDModel, TimeStampedModel):
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name="cohorts")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name="cohorts")
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=64)

    class Meta:
        unique_together = ("program", "academic_year", "code")

    def __str__(self) -> str:
        return self.name


class CourseUnit(UUIDModel, TimeStampedModel):
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name="course_units")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255)
    credits = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    semester = models.PositiveSmallIntegerField(default=1)

    class Meta:
        unique_together = ("program", "code")

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class Subject(UUIDModel, TimeStampedModel):
    course_unit = models.ForeignKey(CourseUnit, on_delete=models.PROTECT, related_name="subjects")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255)
    coefficient = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    hours = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("course_unit", "code")

    def __str__(self) -> str:
        return self.name


class Building(UUIDModel, TimeStampedModel):
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="buildings")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=128)
    floors = models.PositiveSmallIntegerField(default=1)
    # PostGIS geometry will be added in Digital Twin phase
    geo_json = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = ("institution", "code")

    def __str__(self) -> str:
        return self.name


class Room(UUIDModel, TimeStampedModel):
    building = models.ForeignKey(Building, on_delete=models.PROTECT, related_name="rooms")
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=128)
    capacity = models.PositiveIntegerField(default=30)
    room_type = models.CharField(max_length=64, default="classroom")

    class Meta:
        unique_together = ("building", "code")

    def __str__(self) -> str:
        return f"{self.building.code}-{self.code}"


class StudentProfile(UUIDModel, TimeStampedModel, SoftDeleteModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile")
    student_number = models.CharField(max_length=32, unique=True)
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name="students")
    cohort = models.ForeignKey(Cohort, on_delete=models.SET_NULL, null=True, blank=True, related_name="students")
    level = models.CharField(max_length=32, blank=True)
    status = models.CharField(max_length=32, default="active")

    class Meta:
        ordering = ["student_number"]

    def __str__(self) -> str:
        return self.student_number


class StaffProfile(UUIDModel, TimeStampedModel, SoftDeleteModel):
    class StaffType(models.TextChoices):
        PERMANENT = "permanent", "Permanent"
        VACATAIRE = "vacataire", "Vacataire"
        ADMIN = "admin", "Administratif"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile")
    staff_number = models.CharField(max_length=32, unique=True)
    staff_type = models.CharField(max_length=32, choices=StaffType.choices, default=StaffType.PERMANENT)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name="staff")
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="staff"
    )
    title = models.CharField(max_length=128, blank=True)

    def __str__(self) -> str:
        return self.staff_number


class Enrollment(UUIDModel, TimeStampedModel):
    student = models.ForeignKey(StudentProfile, on_delete=models.PROTECT, related_name="enrollments")
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name="enrollments")
    cohort = models.ForeignKey(Cohort, on_delete=models.PROTECT, related_name="enrollments")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name="enrollments")
    status = models.CharField(max_length=32, default="active")
    enrolled_at = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "academic_year", "program")


class TeachingAssignment(UUIDModel, TimeStampedModel):
    teacher = models.ForeignKey(StaffProfile, on_delete=models.PROTECT, related_name="assignments")
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="assignments")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name="assignments")
    cohort = models.ForeignKey(Cohort, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments")

    class Meta:
        unique_together = ("teacher", "subject", "academic_year")
