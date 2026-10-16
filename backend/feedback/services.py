"""Business logic for creating feedback.

Kept out of the view so the server-side orchestration (location resolution,
sentiment, reference numbering, attachments, idempotency) is unit-testable.
"""

from __future__ import annotations

import os

from django.db import IntegrityError, transaction

from feedback.models import Feedback, FeedbackAttachment, Location
from feedback.reference import generate_reference_id
from feedback.sentiment import analyze_sentiment

DEFAULT_STATE = "Kerala"
MAX_REFERENCE_ATTEMPTS = 5


def resolve_location(state: str | None, district: str, local_area: str) -> Location:
    """Resolve (or create) the location.

    Coordinates come from the supported location catalogue only. A location that
    is not in the catalogue is created with unknown (``None``) coordinates — they
    are never fabricated.
    """
    location, _ = Location.objects.get_or_create(
        state=(state or DEFAULT_STATE).strip() or DEFAULT_STATE,
        district=district.strip(),
        local_area=local_area.strip(),
        defaults={"latitude": None, "longitude": None},
    )
    return location


def create_feedback(data: dict, attachments=(), idempotency_key: str | None = None) -> Feedback:
    """Validate-free construction of a Feedback (+ attachments).

    ``data`` is the validated payload from ``FeedbackCreateSerializer``.
    """
    if idempotency_key:
        existing = Feedback.objects.filter(idempotency_key=idempotency_key).first()
        if existing is not None:
            return existing

    department = data["department"]
    service = data["service"]
    overall_rating = data["overall_rating"]

    summary_comment = data["summary_comment"].strip()
    detailed_description = (data.get("detailed_description") or "").strip()

    category_average = (
        data["helpfulness"]
        + data["communication"]
        + data["professionalism"]
        + data["response_time"]
    ) / 4

    analysis = analyze_sentiment(
        f"{summary_comment} {detailed_description}", overall_rating, category_average
    )

    location = resolve_location(data.get("state"), data["district"], data["local_area"])

    attachments = list(attachments)
    last_error: IntegrityError | None = None

    for _ in range(MAX_REFERENCE_ATTEMPTS):
        try:
            with transaction.atomic():
                feedback = Feedback.objects.create(
                    reference_id=generate_reference_id(),
                    location=location,
                    department=department,
                    service=service,
                    overall_rating=overall_rating,
                    helpfulness=data["helpfulness"],
                    communication=data["communication"],
                    professionalism=data["professionalism"],
                    response_time=data["response_time"],
                    timely_delivery=data["timely_delivery"],
                    process_clarity=data["process_clarity"],
                    digital_access_used=data["digital_access_used"],
                    summary_comment=summary_comment,
                    detailed_description=detailed_description,
                    sentiment=analysis.sentiment,
                    sentiment_score=analysis.score,
                    sentiment_status=analysis.status,
                    sentiment_method=analysis.method,
                    keywords=list(analysis.detected_keywords),
                    is_anonymous=data["is_anonymous"],
                    citizen_name=(data.get("citizen_name") or "").strip(),
                    citizen_contact=(data.get("citizen_contact") or "").strip(),
                    idempotency_key=idempotency_key or None,
                )
                for uploaded in attachments:
                    FeedbackAttachment.objects.create(
                        feedback=feedback,
                        file=uploaded,
                        file_name=os.path.basename(uploaded.name or "attachment"),
                        mime_type=(getattr(uploaded, "content_type", "") or "").lower()
                        or "application/octet-stream",
                        size_bytes=uploaded.size,
                    )
            return feedback
        except IntegrityError as exc:
            last_error = exc
            # A concurrent request may have consumed the same idempotency key.
            if idempotency_key:
                existing = Feedback.objects.filter(idempotency_key=idempotency_key).first()
                if existing is not None:
                    return existing

    assert last_error is not None
    raise last_error
