"""Domain models for CivicConnect.

Mirrors ``docs/02-architecture.md`` §6 (the authoritative domain model for the
Django backend) and the DTOs in ``docs/api-contract.md``.
"""

from __future__ import annotations

import os
import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

# --------------------------------------------------------------------------- #
# Enumerations (values are part of the API contract — do not rename).
# --------------------------------------------------------------------------- #

SENTIMENT_CHOICES = [
    ("positive", "Positive"),
    ("neutral", "Neutral"),
    ("negative", "Negative"),
]

SENTIMENT_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("completed", "Completed"),
    ("failed", "Failed"),
]

TIMELY_DELIVERY_CHOICES = [
    ("yes", "Yes"),
    ("minor_delay", "Minor delay"),
    ("significant_delay", "Significant delay"),
]

PROCESS_CLARITY_CHOICES = [
    ("very_clear", "Very clear"),
    ("acceptable", "Acceptable"),
    ("confusing", "Confusing"),
]

RATING_VALIDATORS = [MinValueValidator(1), MaxValueValidator(5)]


def attachment_upload_path(instance: "FeedbackAttachment", filename: str) -> str:
    """Store attachment bytes under a per-feedback, unguessable path."""
    safe_name = os.path.basename(filename or "attachment")
    return f"attachments/{instance.feedback_id}/{uuid.uuid4().hex}-{safe_name}"


# --------------------------------------------------------------------------- #
# Administrative user
# --------------------------------------------------------------------------- #


class AdminUserManager(BaseUserManager):
    """Email-based user manager (the contract logs in with ``email``)."""

    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", "admin")
        if extra.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra)


class AdminUser(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=50, default="admin")
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = AdminUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = "administrator"
        verbose_name_plural = "administrators"
        ordering = ["email"]

    def __str__(self) -> str:
        return self.email

    def get_full_name(self) -> str:
        return self.name or self.email

    def get_short_name(self) -> str:
        return self.name or self.email


# --------------------------------------------------------------------------- #
# Catalogue
# --------------------------------------------------------------------------- #


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)
    nodal_officer = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name="services"
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    average_resolution_days = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["department", "is_active"])]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class Location(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    state = models.CharField(max_length=100, default="Kerala")
    district = models.CharField(max_length=100)
    local_area = models.CharField(max_length=150)
    # Coordinates are optional: absence is valid and must never be fabricated.
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["district", "local_area"]
        constraints = [
            models.UniqueConstraint(
                fields=["state", "district", "local_area"],
                name="unique_location_state_district_area",
            )
        ]
        indexes = [
            models.Index(fields=["district"]),
            models.Index(fields=["district", "local_area"]),
        ]

    def __str__(self) -> str:
        return f"{self.local_area}, {self.district}"

    @property
    def has_coordinates(self) -> bool:
        return self.latitude is not None and self.longitude is not None


# --------------------------------------------------------------------------- #
# Feedback
# --------------------------------------------------------------------------- #


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_id = models.CharField(max_length=32, unique=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="feedbacks")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="feedbacks")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="feedbacks")

    overall_rating = models.PositiveSmallIntegerField(validators=RATING_VALIDATORS)
    helpfulness = models.PositiveSmallIntegerField(validators=RATING_VALIDATORS)
    communication = models.PositiveSmallIntegerField(validators=RATING_VALIDATORS)
    professionalism = models.PositiveSmallIntegerField(validators=RATING_VALIDATORS)
    response_time = models.PositiveSmallIntegerField(validators=RATING_VALIDATORS)

    timely_delivery = models.CharField(max_length=20, choices=TIMELY_DELIVERY_CHOICES)
    process_clarity = models.CharField(max_length=20, choices=PROCESS_CLARITY_CHOICES)
    digital_access_used = models.BooleanField()

    summary_comment = models.CharField(max_length=300)
    detailed_description = models.TextField(blank=True)

    sentiment = models.CharField(max_length=10, choices=SENTIMENT_CHOICES, default="neutral")
    sentiment_score = models.PositiveSmallIntegerField(
        default=50, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    sentiment_status = models.CharField(
        max_length=10, choices=SENTIMENT_STATUS_CHOICES, default="pending"
    )
    sentiment_method = models.CharField(max_length=50, default="heuristic-v1")
    keywords = models.JSONField(default=list, blank=True)

    # Identity is stored internally but never serialised for anonymous records.
    is_anonymous = models.BooleanField(default=True)
    citizen_name = models.CharField(max_length=200, blank=True)
    citizen_contact = models.CharField(max_length=200, blank=True)

    # Set from the `Idempotency-Key` header so a retried submission is not duplicated.
    idempotency_key = models.CharField(max_length=64, null=True, blank=True, unique=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["sentiment"]),
            models.Index(fields=["overall_rating"]),
            models.Index(fields=["-created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(overall_rating__gte=1) & models.Q(overall_rating__lte=5),
                name="feedback_overall_rating_range",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(helpfulness__gte=1)
                    & models.Q(helpfulness__lte=5)
                    & models.Q(communication__gte=1)
                    & models.Q(communication__lte=5)
                    & models.Q(professionalism__gte=1)
                    & models.Q(professionalism__lte=5)
                    & models.Q(response_time__gte=1)
                    & models.Q(response_time__lte=5)
                ),
                name="feedback_category_ratings_range",
            ),
            models.CheckConstraint(
                condition=models.Q(sentiment_score__gte=0) & models.Q(sentiment_score__lte=100),
                name="feedback_sentiment_score_range",
            ),
        ]

    def __str__(self) -> str:
        return self.reference_id

    @property
    def category_ratings(self) -> dict:
        return {
            "helpfulness": self.helpfulness,
            "communication": self.communication,
            "professionalism": self.professionalism,
            "response_time": self.response_time,
        }

    @property
    def category_average(self) -> float:
        return (
            self.helpfulness + self.communication + self.professionalism + self.response_time
        ) / 4

    def public_citizen_name(self) -> str | None:
        """Never expose identity for an anonymous submission (defence in depth)."""
        if self.is_anonymous:
            return None
        return self.citizen_name or None

    def public_citizen_contact(self) -> str | None:
        if self.is_anonymous:
            return None
        return self.citizen_contact or None


class FeedbackAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to=attachment_upload_path)
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.PositiveIntegerField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return self.file_name
