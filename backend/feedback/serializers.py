"""DRF serializers.

Read serializers shape the wire DTOs of ``docs/api-contract.md``; write
serializers own validation (model constraints back them up in the database).
"""

from __future__ import annotations

from django.urls import reverse
from rest_framework import serializers

from feedback.models import (
    PROCESS_CLARITY_CHOICES,
    TIMELY_DELIVERY_CHOICES,
    AdminUser,
    Department,
    Feedback,
    FeedbackAttachment,
    Location,
    Service,
)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "code",
            "description",
            "category",
            "average_resolution_days",
            "is_active",
        ]


class DepartmentSerializer(serializers.ModelSerializer):
    services = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "description",
            "icon_name",
            "contact_email",
            "nodal_officer",
            "is_active",
            "services",
        ]

    def get_services(self, obj):
        include_inactive = bool(self.context.get("include_inactive"))
        services = list(obj.services.all())
        if not include_inactive:
            services = [service for service in services if service.is_active]
        return ServiceSerializer(services, many=True).data


class DepartmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = [
            "name",
            "code",
            "description",
            "icon_name",
            "contact_email",
            "nodal_officer",
            "is_active",
        ]


class ServiceWriteSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())

    class Meta:
        model = Service
        fields = [
            "department",
            "name",
            "code",
            "description",
            "category",
            "average_resolution_days",
            "is_active",
        ]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "state", "district", "local_area", "latitude", "longitude"]


class AttachmentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = FeedbackAttachment
        fields = ["id", "file_name", "mime_type", "size_bytes", "download_url"]

    def get_download_url(self, obj) -> str:
        return reverse("attachment-download", args=[obj.id])


class FeedbackSerializer(serializers.ModelSerializer):
    """Read DTO. Identity fields are forced to ``null`` for anonymous records."""

    location = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()
    category_ratings = serializers.SerializerMethodField()
    structured_answers = serializers.SerializerMethodField()
    citizen_name = serializers.SerializerMethodField()
    citizen_contact = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Feedback
        fields = [
            "id",
            "reference_id",
            "created_at",
            "location",
            "department",
            "service",
            "overall_rating",
            "category_ratings",
            "structured_answers",
            "summary_comment",
            "detailed_description",
            "sentiment",
            "sentiment_score",
            "sentiment_status",
            "sentiment_method",
            "keywords",
            "is_anonymous",
            "citizen_name",
            "citizen_contact",
            "attachments",
        ]

    def get_location(self, obj) -> dict:
        location = obj.location
        return {
            "state": location.state,
            "district": location.district,
            "local_area": location.local_area,
            "latitude": location.latitude,
            "longitude": location.longitude,
        }

    def get_department(self, obj) -> dict:
        return {"id": str(obj.department_id), "name": obj.department.name, "code": obj.department.code}

    def get_service(self, obj) -> dict:
        return {"id": str(obj.service_id), "name": obj.service.name, "code": obj.service.code}

    def get_category_ratings(self, obj) -> dict:
        return obj.category_ratings

    def get_structured_answers(self, obj) -> dict:
        return {
            "timely_delivery": obj.timely_delivery,
            "process_clarity": obj.process_clarity,
            "digital_access_used": obj.digital_access_used,
        }

    def get_citizen_name(self, obj):
        return obj.public_citizen_name()

    def get_citizen_contact(self, obj):
        return obj.public_citizen_contact()


class FeedbackCreateSerializer(serializers.Serializer):
    """Write serializer for ``POST /feedback/`` (JSON or multipart)."""

    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())

    # The client sends district/local area only; `state` defaults to Kerala.
    state = serializers.CharField(required=False, allow_blank=True, max_length=100)
    district = serializers.CharField(max_length=100)
    local_area = serializers.CharField(max_length=150)

    overall_rating = serializers.IntegerField(min_value=1, max_value=5)
    helpfulness = serializers.IntegerField(min_value=1, max_value=5)
    communication = serializers.IntegerField(min_value=1, max_value=5)
    professionalism = serializers.IntegerField(min_value=1, max_value=5)
    response_time = serializers.IntegerField(min_value=1, max_value=5)

    timely_delivery = serializers.ChoiceField(choices=[choice[0] for choice in TIMELY_DELIVERY_CHOICES])
    process_clarity = serializers.ChoiceField(choices=[choice[0] for choice in PROCESS_CLARITY_CHOICES])
    digital_access_used = serializers.BooleanField()

    summary_comment = serializers.CharField(min_length=10, max_length=300)
    detailed_description = serializers.CharField(
        required=False, allow_blank=True, max_length=5000, default=""
    )
    is_anonymous = serializers.BooleanField()
    citizen_name = serializers.CharField(
        required=False, allow_blank=True, max_length=200, default=""
    )
    citizen_contact = serializers.CharField(
        required=False, allow_blank=True, max_length=200, default=""
    )

    def validate_department(self, value):
        if not value.is_active:
            raise serializers.ValidationError("The selected department is not available.")
        return value

    def validate(self, attrs):
        if attrs["service"].department_id != attrs["department"].id:
            raise serializers.ValidationError(
                {"service": ["The selected service does not belong to the chosen department."]}
            )
        if not attrs["is_anonymous"] and not (attrs.get("citizen_name") or "").strip():
            raise serializers.ValidationError(
                {"citizen_name": ["Please enter your name for an identified submission."]}
            )
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = ["id", "email", "name", "role"]
