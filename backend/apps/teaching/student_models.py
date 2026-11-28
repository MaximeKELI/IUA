"""Student-facing extras — finance, stages, clubs, library, career."""

from django.db import models

from apps.academic.models import StudentProfile
from apps.core.models import TimeStampedModel, UUIDModel


class StudentPayment(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DUE = "due", "À payer"
        PAID = "paid", "Payé"
        PARTIAL = "partial", "Partiel"
        OVERDUE = "overdue", "En retard"

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="payments")
    label = models.CharField(max_length=255)
    amount_xof = models.PositiveIntegerField()
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DUE)
    method = models.CharField(max_length=64, blank=True)
    reference = models.CharField(max_length=64, blank=True)
    provider_ref = models.CharField(max_length=128, blank=True, db_index=True)
    idempotency_key = models.CharField(max_length=128, blank=True, unique=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)


class Internship(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        SEARCHING = "searching", "En recherche"
        ONGOING = "ongoing", "En cours"
        DONE = "done", "Terminé"
        VALIDATED = "validated", "Validé"

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="internships")
    company = models.CharField(max_length=255)
    role = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=128, blank=True)
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SEARCHING)
    supervisor = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)


class Club(UUIDModel, TimeStampedModel):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    meeting_info = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)


class ClubMembership(UUIDModel, TimeStampedModel):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="memberships")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="club_memberships")
    role = models.CharField(max_length=64, default="membre")

    class Meta:
        unique_together = ("club", "student")


class LibraryItem(UUIDModel, TimeStampedModel):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    kind = models.CharField(max_length=32, default="book")  # book, article, ebook
    subject_tags = models.CharField(max_length=255, blank=True)
    available = models.BooleanField(default=True)
    url = models.URLField(blank=True)


class CareerOpportunity(UUIDModel, TimeStampedModel):
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True)
    kind = models.CharField(max_length=32, default="job")  # job, internship, talk
    location = models.CharField(max_length=128, blank=True)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True)
    deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)


class ScholarshipOffer(UUIDModel, TimeStampedModel):
    title = models.CharField(max_length=255)
    provider = models.CharField(max_length=255, blank=True)
    amount_label = models.CharField(max_length=128, blank=True)
    deadline = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)


class ExamEvent(UUIDModel, TimeStampedModel):
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name="exam_events", null=True, blank=True
    )
    program_code = models.CharField(max_length=64, blank=True)
    title = models.CharField(max_length=255)
    subject_name = models.CharField(max_length=255, blank=True)
    starts_at = models.DateTimeField()
    room = models.CharField(max_length=64, blank=True)
    notes = models.CharField(max_length=255, blank=True)
