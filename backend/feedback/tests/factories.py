"""Small helpers for building model instances in tests."""

from __future__ import annotations

from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from feedback.models import AdminUser, Department, Feedback, Location, Service
from feedback.reference import generate_reference_id
from feedback.sentiment import analyze_sentiment


def api_client(user: AdminUser | None = None) -> APIClient:
    """An API client, optionally authenticated with a DRF token."""
    client = APIClient()
    if user is not None:
        token, _ = Token.objects.get_or_create(user=user)
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


def make_admin(email: str = "admin@example.gov.in", password: str = "DemoAdmin@2026", **extra) -> AdminUser:
    extra.setdefault("name", "Test Admin")
    extra.setdefault("is_staff", True)
    return AdminUser.objects.create_user(email=email, password=password, **extra)


def make_department(code: str = "TST", name: str | None = None, is_active: bool = True) -> Department:
    return Department.objects.create(name=name or f"Test Department {code}", code=code, is_active=is_active)


def make_service(department: Department, code: str = "TST-01", name: str | None = None, is_active: bool = True) -> Service:
    return Service.objects.create(
        department=department,
        name=name or f"Test Service {code}",
        code=code,
        is_active=is_active,
    )


def make_location(
    district: str = "Ernakulam",
    local_area: str = "Kanayannur (Kochi)",
    latitude: float | None = 9.97,
    longitude: float | None = 76.28,
    state: str = "Kerala",
) -> Location:
    return Location.objects.create(
        state=state,
        district=district,
        local_area=local_area,
        latitude=latitude,
        longitude=longitude,
    )


def make_feedback(
    *,
    department: Department,
    service: Service,
    location: Location,
    summary: str = "A reasonably detailed summary comment.",
    detailed: str = "",
    overall: int = 4,
    categories: dict | None = None,
    is_anonymous: bool = True,
    citizen_name: str = "",
    citizen_contact: str = "",
    created_at=None,
    idempotency_key: str | None = None,
) -> Feedback:
    categories = categories or {}
    helpfulness = categories.get("helpfulness", overall)
    communication = categories.get("communication", overall)
    professionalism = categories.get("professionalism", overall)
    response_time = categories.get("response_time", overall)
    category_average = (helpfulness + communication + professionalism + response_time) / 4

    analysis = analyze_sentiment(f"{summary} {detailed}", overall, category_average)

    feedback = Feedback.objects.create(
        reference_id=generate_reference_id(),
        location=location,
        department=department,
        service=service,
        overall_rating=overall,
        helpfulness=helpfulness,
        communication=communication,
        professionalism=professionalism,
        response_time=response_time,
        timely_delivery="yes",
        process_clarity="very_clear",
        digital_access_used=True,
        summary_comment=summary,
        detailed_description=detailed,
        sentiment=analysis.sentiment,
        sentiment_score=analysis.score,
        sentiment_status=analysis.status,
        sentiment_method=analysis.method,
        keywords=list(analysis.detected_keywords),
        is_anonymous=is_anonymous,
        citizen_name=citizen_name,
        citizen_contact=citizen_contact,
        idempotency_key=idempotency_key,
    )

    if created_at is not None:
        Feedback.objects.filter(pk=feedback.pk).update(created_at=created_at)
        feedback.refresh_from_db()

    return feedback


def valid_payload(department: Department, service: Service, **overrides) -> dict:
    payload = {
        "department": str(department.id),
        "service": str(service.id),
        "district": "Ernakulam",
        "local_area": "Kanayannur (Kochi)",
        "overall_rating": 4,
        "helpfulness": 4,
        "communication": 4,
        "professionalism": 4,
        "response_time": 4,
        "timely_delivery": "yes",
        "process_clarity": "very_clear",
        "digital_access_used": True,
        "summary_comment": "The staff were helpful and the process was fast.",
        "detailed_description": "",
        "is_anonymous": True,
    }
    payload.update(overrides)
    return payload


__all__ = [
    "api_client",
    "make_admin",
    "make_department",
    "make_service",
    "make_location",
    "make_feedback",
    "valid_payload",
    "timezone",
]
