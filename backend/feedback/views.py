"""API views for CivicConnect (``/api/v1/``).

Permissions follow ``docs/api-contract.md`` §9: the project default denies by
default, public endpoints opt into ``AllowAny``, and admin endpoints use
``IsAdminUser`` (401 anonymous / 403 non-staff).
"""

from __future__ import annotations

import csv
import io
import uuid

from django.db.models import Prefetch
from django.db.models.deletion import ProtectedError
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate

from feedback import analytics
from feedback.attachments import validate_attachments
from feedback.filters import apply_feedback_filters, queryset_to_rows
from feedback.models import Department, Feedback, FeedbackAttachment, Location, Service
from feedback.pagination import StandardPagination
from feedback.serializers import (
    AdminUserSerializer,
    AttachmentSerializer,  # noqa: F401  (re-exported for convenience)
    DepartmentSerializer,
    DepartmentWriteSerializer,
    FeedbackCreateSerializer,
    FeedbackSerializer,
    LocationSerializer,
    ServiceSerializer,
    ServiceWriteSerializer,
)
from feedback.services import create_feedback

CSV_COLUMNS = [
    "reference_id",
    "created_at",
    "district",
    "local_area",
    "department",
    "service",
    "overall_rating",
    "helpfulness",
    "communication",
    "professionalism",
    "response_time",
    "sentiment",
    "sentiment_score",
    "summary_comment",
    "is_anonymous",
]


def _is_truthy(value) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _parse_uuid_or_400(field: str, raw: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(raw))
    except (ValueError, AttributeError, TypeError):
        raise ValidationError({field: ["Must be a valid UUID."]})


def _can_see_inactive(request) -> bool:
    return bool(getattr(request.user, "is_staff", False))


def _feedback_queryset():
    return Feedback.objects.select_related("location", "department", "service")


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        failure = Response(
            {"detail": "Unable to log in with provided credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
        if not email or not password:
            return failure
        user = authenticate(request, username=email, password=password)
        if user is None or not user.is_active or not user.is_staff:
            return failure
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": AdminUserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        if request.auth is not None:
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(AdminUserSerializer(request.user).data)


# --------------------------------------------------------------------------- #
# Feedback
# --------------------------------------------------------------------------- #


class FeedbackListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "POST" else [IsAdminUser()]

    def get(self, request):
        queryset = apply_feedback_filters(Feedback.objects.all(), request.query_params)
        queryset = queryset.select_related("location", "department", "service").prefetch_related(
            "attachments"
        )
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = FeedbackSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = FeedbackCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        files = request.FILES.getlist("attachments")
        validate_attachments(files)

        idempotency_key = (request.headers.get("Idempotency-Key") or "").strip() or None
        feedback = create_feedback(serializer.validated_data, files, idempotency_key)

        feedback = (
            _feedback_queryset().prefetch_related("attachments").get(pk=feedback.pk)
        )
        return Response(FeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED)


class FeedbackDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk) -> Feedback:
        return get_object_or_404(_feedback_queryset().prefetch_related("attachments"), pk=pk)

    def get(self, request, pk):
        return Response(FeedbackSerializer(self.get_object(pk)).data)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AttachmentDownloadView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        attachment = get_object_or_404(FeedbackAttachment, pk=pk)
        try:
            file_handle = attachment.file.open("rb")
        except FileNotFoundError:
            raise NotFound("The stored attachment is unavailable.")
        return FileResponse(
            file_handle,
            as_attachment=True,
            filename=attachment.file_name,
            content_type=attachment.mime_type or "application/octet-stream",
        )


# --------------------------------------------------------------------------- #
# Departments & services
# --------------------------------------------------------------------------- #


def _department_queryset():
    return Department.objects.prefetch_related(
        Prefetch("services", queryset=Service.objects.all())
    )


class DepartmentListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAdminUser()]

    def get(self, request):
        include_inactive = _is_truthy(request.query_params.get("include_inactive")) and (
            _can_see_inactive(request)
        )
        queryset = _department_queryset()
        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        serializer = DepartmentSerializer(
            queryset, many=True, context={"include_inactive": include_inactive}
        )
        return Response({"results": serializer.data})

    def post(self, request):
        serializer = DepartmentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        return Response(
            DepartmentSerializer(department, context={"include_inactive": True}).data,
            status=status.HTTP_201_CREATED,
        )


class DepartmentDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        department = get_object_or_404(Department, pk=pk)
        serializer = DepartmentWriteSerializer(department, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        return Response(DepartmentSerializer(department, context={"include_inactive": True}).data)

    def delete(self, request, pk):
        department = get_object_or_404(Department, pk=pk)
        if department.feedbacks.exists():
            return Response(
                {
                    "detail": "This department has existing feedback and cannot be deleted. "
                    "Deactivate it instead."
                },
                status=status.HTTP_409_CONFLICT,
            )
        if department.services.exists():
            return Response(
                {
                    "detail": "This department still has services and cannot be deleted. "
                    "Remove its services or deactivate it instead."
                },
                status=status.HTTP_409_CONFLICT,
            )
        try:
            department.delete()
        except ProtectedError:
            return Response(
                {"detail": "This department is referenced and cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServiceListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAdminUser()]

    def get(self, request):
        include_inactive = _is_truthy(request.query_params.get("include_inactive")) and (
            _can_see_inactive(request)
        )
        queryset = Service.objects.select_related("department").all()
        department = request.query_params.get("department")
        if department:
            queryset = queryset.filter(department_id=_parse_uuid_or_400("department", department))
        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        return Response({"results": ServiceSerializer(queryset, many=True).data})

    def post(self, request):
        serializer = ServiceWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = serializer.save()
        return Response(ServiceSerializer(service).data, status=status.HTTP_201_CREATED)


class ServiceDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        serializer = ServiceWriteSerializer(service, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = serializer.save()
        return Response(ServiceSerializer(service).data)

    def delete(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        if service.feedbacks.exists():
            return Response(
                {
                    "detail": "This service has existing feedback and cannot be deleted. "
                    "Deactivate it instead."
                },
                status=status.HTTP_409_CONFLICT,
            )
        try:
            service.delete()
        except ProtectedError:
            return Response(
                {"detail": "This service is referenced and cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- #
# Locations
# --------------------------------------------------------------------------- #


class LocationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Location.objects.all()
        return Response({"results": LocationSerializer(queryset, many=True).data})


# --------------------------------------------------------------------------- #
# Analytics
# --------------------------------------------------------------------------- #


def _all_departments() -> list[Department]:
    return list(Department.objects.all())


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = apply_feedback_filters(Feedback.objects.all(), request.query_params)
        rows = queryset_to_rows(queryset)
        return Response(analytics.summarize(rows, _all_departments()))


class GeographicAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = apply_feedback_filters(Feedback.objects.all(), request.query_params)
        rows = queryset_to_rows(queryset)
        return Response({"results": analytics.geographic_aggregates(rows)})


class InsightsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = apply_feedback_filters(Feedback.objects.all(), request.query_params)
        rows = queryset_to_rows(queryset)
        return Response(analytics.derive_insights(rows, _all_departments()))


class PublicSummaryView(APIView):
    """Public, aggregate-only statistics (no login required).

    Exposes overall totals, per-department averages and a district-wise sentiment
    breakdown. It never returns individual records, comments, or identity, and the
    free-text ``search`` filter is disabled so a public caller cannot probe for a
    named citizen. Districts below ``PUBLIC_MIN_SAMPLE`` omit percentages/level.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        queryset = apply_feedback_filters(
            Feedback.objects.all(), request.query_params, allow_search=False
        )
        rows = queryset_to_rows(queryset)
        return Response(analytics.public_summary(rows, _all_departments()))


# --------------------------------------------------------------------------- #
# Reports
# --------------------------------------------------------------------------- #


class ReportExportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = apply_feedback_filters(Feedback.objects.all(), request.query_params)
        queryset = queryset.select_related("location", "department", "service")

        buffer = io.StringIO()
        writer = csv.writer(buffer, lineterminator="\r\n")
        writer.writerow(CSV_COLUMNS)
        for feedback in queryset:
            writer.writerow(
                [
                    feedback.reference_id,
                    feedback.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    feedback.location.district,
                    feedback.location.local_area,
                    feedback.department.name,
                    feedback.service.name,
                    feedback.overall_rating,
                    feedback.helpfulness,
                    feedback.communication,
                    feedback.professionalism,
                    feedback.response_time,
                    feedback.sentiment,
                    feedback.sentiment_score,
                    feedback.summary_comment,
                    "yes" if feedback.is_anonymous else "no",
                ]
            )

        filename = f"civicconnect-feedback-{timezone.now().date().isoformat()}.csv"
        response = HttpResponse(buffer.getvalue(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
