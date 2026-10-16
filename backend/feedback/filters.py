"""Shared filter parsing for `/feedback/`, the analytics endpoints and report export.

Accepts the parameters documented in ``docs/api-contract.md`` §1.3:

``district``, ``local_area``, ``department``, ``service``, ``sentiment``, ``rating``,
``date_from``, ``date_to``, ``search``, ``ordering``.

It additionally accepts the client's ``date_range`` (``7days`` | ``30days`` | ``90days``),
which the frontend sends instead of explicit dates — see the contract's note on it.

Unrecognised parameters are ignored; invalid values raise a DRF ``ValidationError``
(HTTP 400) matching the contract's error envelope.
"""

from __future__ import annotations

import uuid
from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError

from feedback.analytics import FeedbackRow

SENTIMENT_VALUES = {"positive", "neutral", "negative"}
DATE_RANGE_DAYS = {"7days": 7, "30days": 30, "90days": 90}
ORDERING_VALUES = {"created_at", "-created_at", "overall_rating", "-overall_rating"}
DEFAULT_ORDERING = "-created_at"

#: Message text is part of what the UI surfaces, so keep it human-readable.
INVALID_ORDERING_MESSAGE = (
    "Must be one of: created_at, -created_at, overall_rating, -overall_rating."
)


def _fail(field: str, message: str):
    raise ValidationError({field: [message]})


def _parse_uuid(field: str, raw: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(raw))
    except (ValueError, AttributeError, TypeError):
        _fail(field, "Must be a valid UUID.")


def apply_feedback_filters(queryset, query_params, *, allow_search: bool = True):
    """Return ``queryset`` narrowed by the recognised filter parameters.

    ``allow_search=False`` skips the free-text ``search`` parameter. The public
    aggregate endpoint uses this because ``search`` matches ``citizen_name``, and a
    public caller must not be able to probe whether a named citizen submitted
    feedback.
    """
    district = query_params.get("district")
    if district:
        queryset = queryset.filter(location__district=district)

    local_area = query_params.get("local_area")
    if local_area:
        queryset = queryset.filter(location__local_area=local_area)

    department = query_params.get("department")
    if department:
        queryset = queryset.filter(department_id=_parse_uuid("department", department))

    service = query_params.get("service")
    if service:
        queryset = queryset.filter(service_id=_parse_uuid("service", service))

    sentiment = query_params.get("sentiment")
    if sentiment:
        if sentiment not in SENTIMENT_VALUES:
            _fail("sentiment", "Must be one of: positive, neutral, negative.")
        queryset = queryset.filter(sentiment=sentiment)

    rating = query_params.get("rating")
    if rating:
        try:
            rating_value = int(rating)
        except (TypeError, ValueError):
            _fail("rating", "Must be an integer between 1 and 5.")
        if not 1 <= rating_value <= 5:
            _fail("rating", "Must be an integer between 1 and 5.")
        queryset = queryset.filter(overall_rating=rating_value)

    date_range = query_params.get("date_range")
    if date_range:
        days = DATE_RANGE_DAYS.get(date_range)
        if days is None:
            _fail("date_range", "Must be one of: 7days, 30days, 90days.")
        queryset = queryset.filter(created_at__gte=timezone.now() - timedelta(days=days))

    date_from = query_params.get("date_from")
    if date_from:
        parsed_from = parse_date(date_from)
        if parsed_from is None:
            _fail("date_from", "Must be a valid date (YYYY-MM-DD).")
        queryset = queryset.filter(created_at__date__gte=parsed_from)

    date_to = query_params.get("date_to")
    if date_to:
        parsed_to = parse_date(date_to)
        if parsed_to is None:
            _fail("date_to", "Must be a valid date (YYYY-MM-DD).")
        queryset = queryset.filter(created_at__date__lte=parsed_to)

    search = (query_params.get("search") or "").strip()
    if search and allow_search:
        from django.db.models import Q

        queryset = queryset.filter(
            Q(reference_id__icontains=search)
            | Q(summary_comment__icontains=search)
            | Q(detailed_description__icontains=search)
            | Q(service__name__icontains=search)
            | Q(department__name__icontains=search)
            | Q(location__district__icontains=search)
            | Q(location__local_area__icontains=search)
            | Q(citizen_name__icontains=search)
        )

    ordering = query_params.get("ordering") or DEFAULT_ORDERING
    if ordering not in ORDERING_VALUES:
        _fail("ordering", INVALID_ORDERING_MESSAGE)
    queryset = queryset.order_by(ordering)

    return queryset


def queryset_to_rows(queryset) -> list[FeedbackRow]:
    """Project a filtered queryset into the rows analytics consumes."""
    rows: list[FeedbackRow] = []
    for feedback in queryset.select_related("location", "department"):
        rows.append(
            FeedbackRow(
                sentiment=feedback.sentiment,
                overall_rating=feedback.overall_rating,
                created_at=feedback.created_at,
                department_id=str(feedback.department_id),
                department_name=feedback.department.name,
                keywords=tuple(feedback.keywords or ()),
                district=feedback.location.district,
                latitude=feedback.location.latitude,
                longitude=feedback.location.longitude,
            )
        )
    return rows
