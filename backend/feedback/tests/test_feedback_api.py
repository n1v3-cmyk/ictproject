"""Feedback create/read/list/delete, privacy, idempotency, filters and pagination."""

from __future__ import annotations

from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from feedback.models import Feedback
from feedback.tests.factories import (
    api_client,
    make_admin,
    make_department,
    make_feedback,
    make_location,
    make_service,
    valid_payload,
)

FEEDBACK_URL = "/api/v1/feedback/"


class FeedbackCreateTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.client = api_client(self.admin)
        self.department = make_department(code="MVD", name="Motor Vehicles Department (MVD)")
        self.service = make_service(self.department, code="MVD-01", name="Driving License Renewal")
        self.location = make_location()

    def test_public_creation_without_authentication(self):
        response = api_client().post(
            FEEDBACK_URL, valid_payload(self.department, self.service), format="json"
        )
        self.assertEqual(response.status_code, 201, response.data)

    def test_created_feedback_matches_contract_shape(self):
        response = self.client.post(
            FEEDBACK_URL, valid_payload(self.department, self.service), format="json"
        )
        self.assertEqual(response.status_code, 201, response.data)
        data = response.data
        self.assertRegex(data["reference_id"], r"^CC-KL-\d{4}-\d+$")
        self.assertTrue(data["created_at"].endswith("Z"))
        self.assertEqual(
            set(data["location"]),
            {"state", "district", "local_area", "latitude", "longitude"},
        )
        self.assertEqual(set(data["department"]), {"id", "name", "code"})
        self.assertEqual(set(data["service"]), {"id", "name", "code"})
        self.assertEqual(
            set(data["category_ratings"]),
            {"helpfulness", "communication", "professionalism", "response_time"},
        )
        self.assertEqual(
            set(data["structured_answers"]),
            {"timely_delivery", "process_clarity", "digital_access_used"},
        )
        self.assertEqual(data["sentiment_method"], "heuristic-v1")
        self.assertEqual(data["sentiment_status"], "completed")
        self.assertIn(data["sentiment"], {"positive", "neutral", "negative"})
        self.assertTrue(0 <= data["sentiment_score"] <= 100)
        self.assertIn("helpful", data["keywords"])

    def test_create_uses_server_side_location_and_ignores_client_coordinates(self):
        payload = valid_payload(self.department, self.service)
        payload["latitude"] = 0.0
        payload["longitude"] = 0.0
        response = self.client.post(FEEDBACK_URL, payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        # Resolved from the catalogue (Ernakulam), not the client's zeros.
        self.assertEqual(response.data["location"]["district"], "Ernakulam")
        self.assertNotEqual(response.data["location"]["latitude"], 0.0)

    def test_multipart_submission_with_attachment(self):
        payload = valid_payload(self.department, self.service)
        upload = SimpleUploadedFile("evidence.png", b"\x89PNG\r\n\x1a\nfake", content_type="image/png")
        response = api_client().post(
            FEEDBACK_URL, {**payload, "attachments": [upload]}, format="multipart"
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(response.data["attachments"]), 1)
        self.assertEqual(response.data["attachments"][0]["file_name"], "evidence.png")
        self.assertTrue(response.data["attachments"][0]["download_url"].startswith("/api/v1/attachments/"))

    def test_overall_rating_out_of_range_is_400(self):
        response = self.client.post(
            FEEDBACK_URL, valid_payload(self.department, self.service, overall_rating=9), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("overall_rating", response.data)

    def test_short_summary_is_400(self):
        response = self.client.post(
            FEEDBACK_URL, valid_payload(self.department, self.service, summary_comment="short"), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("summary_comment", response.data)

    def test_service_must_belong_to_department(self):
        other = make_department(code="KSEB")
        other_service = make_service(other, code="KSEB-01")
        response = self.client.post(
            FEEDBACK_URL, valid_payload(self.department, other_service), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("service", response.data)

    def test_inactive_department_is_rejected(self):
        inactive = make_department(code="OLD", is_active=False)
        inactive_service = make_service(inactive, code="OLD-01")
        response = self.client.post(
            FEEDBACK_URL, valid_payload(inactive, inactive_service), format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("department", response.data)

    def test_identified_submission_requires_a_name(self):
        response = self.client.post(
            FEEDBACK_URL,
            valid_payload(self.department, self.service, is_anonymous=False, citizen_name=""),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("citizen_name", response.data)

    def test_anonymous_submission_never_returns_identity(self):
        payload = valid_payload(
            self.department, self.service, is_anonymous=True, citizen_name="Should Not Leak"
        )
        response = self.client.post(FEEDBACK_URL, payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data["citizen_name"])
        self.assertIsNone(response.data["citizen_contact"])
        # Retrieve path is equally safe.
        detail = self.client.get(f"{FEEDBACK_URL}{response.data['id']}/")
        self.assertIsNone(detail.data["citizen_name"])

    def test_identified_submission_returns_name(self):
        payload = valid_payload(
            self.department, self.service, is_anonymous=False, citizen_name="Meera Nair"
        )
        response = self.client.post(FEEDBACK_URL, payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["citizen_name"], "Meera Nair")

    def test_idempotency_key_replays_original(self):
        payload = valid_payload(self.department, self.service)
        first = api_client().post(
            FEEDBACK_URL, payload, format="json", HTTP_IDEMPOTENCY_KEY="11111111-1111-1111-1111-111111111111"
        )
        second = api_client().post(
            FEEDBACK_URL, payload, format="json", HTTP_IDEMPOTENCY_KEY="11111111-1111-1111-1111-111111111111"
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Feedback.objects.count(), 1)

    def test_unknown_location_gets_null_coordinates(self):
        payload = valid_payload(self.department, self.service)
        payload.update({"district": "Atlantis", "local_area": "Nowhere"})
        response = api_client().post(FEEDBACK_URL, payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data["location"]["latitude"])
        self.assertIsNone(response.data["location"]["longitude"])


class FeedbackReadTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.client = api_client(self.admin)
        self.department = make_department(code="REV")
        self.service = make_service(self.department, code="REV-01")
        self.location = make_location()

    def _make(self, **kwargs):
        return make_feedback(
            department=self.department, service=self.service, location=self.location, **kwargs
        )

    def test_list_requires_admin(self):
        self.assertEqual(api_client().get(FEEDBACK_URL).status_code, 401)

    def test_list_returns_pagination_envelope(self):
        self._make()
        response = self.client.get(FEEDBACK_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"count", "next", "previous", "results"})
        self.assertEqual(response.data["count"], 1)

    def test_page_size_is_respected(self):
        for _ in range(5):
            self._make()
        response = self.client.get(FEEDBACK_URL, {"page_size": 2})
        self.assertEqual(len(response.data["results"]), 2)
        self.assertEqual(response.data["count"], 5)
        self.assertIsNotNone(response.data["next"])

    def test_retrieve_and_delete(self):
        feedback = self._make()
        detail = self.client.get(f"{FEEDBACK_URL}{feedback.id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["id"], str(feedback.id))
        deleted = self.client.delete(f"{FEEDBACK_URL}{feedback.id}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(self.client.get(f"{FEEDBACK_URL}{feedback.id}/").status_code, 404)

    def test_filter_by_sentiment_and_district(self):
        negative_location = make_location(district="Kollam", local_area="Kollam")
        self._make(summary="There was a long delay and it was slow.", overall=1)
        make_feedback(
            department=self.department,
            service=self.service,
            location=negative_location,
            summary="Excellent, fast and helpful.",
            overall=5,
        )
        negative = self.client.get(FEEDBACK_URL, {"sentiment": "negative"})
        self.assertEqual(negative.data["count"], 1)
        kollam = self.client.get(FEEDBACK_URL, {"district": "Kollam"})
        self.assertEqual(kollam.data["count"], 1)

    def test_filter_by_rating(self):
        self._make(overall=2)
        self._make(overall=5)
        self.assertEqual(self.client.get(FEEDBACK_URL, {"rating": 5}).data["count"], 1)

    def test_filter_by_department_and_service(self):
        other = make_department(code="KSEB")
        other_service = make_service(other, code="KSEB-01")
        self._make()
        make_feedback(department=other, service=other_service, location=self.location)
        self.assertEqual(
            self.client.get(FEEDBACK_URL, {"department": str(other.id)}).data["count"], 1
        )
        self.assertEqual(
            self.client.get(FEEDBACK_URL, {"service": str(self.service.id)}).data["count"], 1
        )

    def test_search_matches_reference_and_comment(self):
        feedback = self._make(summary="Portal stuck during biometric verification.")
        self.assertEqual(
            self.client.get(FEEDBACK_URL, {"search": feedback.reference_id}).data["count"], 1
        )
        self.assertEqual(
            self.client.get(FEEDBACK_URL, {"search": "biometric"}).data["count"], 1
        )
        self.assertEqual(self.client.get(FEEDBACK_URL, {"search": "zzz-no-match"}).data["count"], 0)

    def test_date_range_filter(self):
        now = timezone.now()
        self._make(created_at=now - timedelta(days=2))
        self._make(created_at=now - timedelta(days=45))
        self.assertEqual(self.client.get(FEEDBACK_URL, {"date_range": "7days"}).data["count"], 1)
        self.assertEqual(self.client.get(FEEDBACK_URL, {"date_range": "90days"}).data["count"], 2)

    def test_date_from_and_date_to(self):
        now = timezone.now()
        self._make(created_at=now - timedelta(days=10))
        self._make(created_at=now - timedelta(days=1))
        date_from = (now - timedelta(days=5)).date().isoformat()
        self.assertEqual(self.client.get(FEEDBACK_URL, {"date_from": date_from}).data["count"], 1)

    def test_ordering(self):
        self._make(overall=1)
        self._make(overall=5)
        ascending = self.client.get(FEEDBACK_URL, {"ordering": "overall_rating"})
        self.assertEqual(ascending.data["results"][0]["overall_rating"], 1)
        descending = self.client.get(FEEDBACK_URL, {"ordering": "-overall_rating"})
        self.assertEqual(descending.data["results"][0]["overall_rating"], 5)

    def test_invalid_filter_values_are_400(self):
        self.assertEqual(self.client.get(FEEDBACK_URL, {"sentiment": "angry"}).status_code, 400)
        self.assertEqual(self.client.get(FEEDBACK_URL, {"rating": 9}).status_code, 400)
        self.assertEqual(self.client.get(FEEDBACK_URL, {"ordering": "nope"}).status_code, 400)
        self.assertEqual(self.client.get(FEEDBACK_URL, {"department": "not-a-uuid"}).status_code, 400)
        self.assertEqual(self.client.get(FEEDBACK_URL, {"date_range": "1year"}).status_code, 400)

    def test_unrecognised_filters_are_ignored(self):
        self._make()
        response = self.client.get(FEEDBACK_URL, {"totally_unknown": "x"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
