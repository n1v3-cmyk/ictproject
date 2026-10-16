"""Frontend/backend contract compatibility.

These assertions pin the exact wire shapes that ``frontend/src/api/contract.ts``
and ``frontend/src/api/mappers.ts`` consume, so a backend change that would break
the UI fails here first.
"""

from __future__ import annotations

from django.test import TestCase

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
DEPARTMENTS_URL = "/api/v1/departments/"
SERVICES_URL = "/api/v1/services/"
LOCATIONS_URL = "/api/v1/locations/"
LOGIN_URL = "/api/v1/auth/login/"


class ContractShapeTests(TestCase):
    def setUp(self):
        self.admin = make_admin(email="admin@civicconnect.gov.in", password="DemoAdmin@2026")
        self.department = make_department(code="MVD", name="Motor Vehicles Department (MVD)")
        self.service = make_service(self.department, code="MVD-01", name="Driving License Renewal")
        self.location = make_location()

    def test_feedback_dto_has_every_field_the_mapper_reads(self):
        response = api_client().post(
            FEEDBACK_URL, valid_payload(self.department, self.service), format="json"
        )
        self.assertEqual(response.status_code, 201, response.data)
        data = response.data
        for field in (
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
        ):
            self.assertIn(field, data, field)

    def test_pagination_envelope(self):
        make_feedback(department=self.department, service=self.service, location=self.location)
        response = api_client(self.admin).get(FEEDBACK_URL)
        self.assertEqual(set(response.data), {"count", "next", "previous", "results"})
        self.assertIsInstance(response.data["count"], int)
        self.assertIsInstance(response.data["results"], list)

    def test_validation_error_envelope_is_field_keyed(self):
        response = api_client().post(
            FEEDBACK_URL,
            valid_payload(self.department, self.service, overall_rating=7),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("overall_rating", response.data)
        self.assertIsInstance(response.data["overall_rating"], list)

    def test_authentication_error_envelope_is_detail(self):
        response = api_client().get(FEEDBACK_URL)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(set(response.data), {"detail"})

    def test_department_dto_shape(self):
        response = api_client().get(DEPARTMENTS_URL)
        item = response.data["results"][0]
        self.assertEqual(
            set(item),
            {
                "id",
                "name",
                "code",
                "description",
                "icon_name",
                "contact_email",
                "nodal_officer",
                "is_active",
                "services",
            },
        )
        self.assertEqual(
            set(item["services"][0]),
            {"id", "name", "code", "description", "category", "average_resolution_days", "is_active"},
        )

    def test_service_dto_shape(self):
        item = api_client().get(SERVICES_URL).data["results"][0]
        self.assertEqual(
            set(item),
            {"id", "name", "code", "description", "category", "average_resolution_days", "is_active"},
        )

    def test_location_dto_shape(self):
        item = api_client().get(LOCATIONS_URL).data["results"][0]
        self.assertEqual(
            set(item), {"id", "state", "district", "local_area", "latitude", "longitude"}
        )

    def test_login_response_shape(self):
        response = api_client().post(
            LOGIN_URL, {"email": "admin@civicconnect.gov.in", "password": "DemoAdmin@2026"}, format="json"
        )
        self.assertEqual(set(response.data), {"token", "user"})
        self.assertEqual(set(response.data["user"]), {"id", "email", "name", "role"})

    def test_ids_are_uuid_strings(self):
        make_feedback(department=self.department, service=self.service, location=self.location)
        item = api_client(self.admin).get(FEEDBACK_URL).data["results"][0]
        self.assertRegex(item["id"], r"^[0-9a-f-]{36}$")
        self.assertRegex(item["department"]["id"], r"^[0-9a-f-]{36}$")

    def test_created_at_is_utc_iso8601(self):
        make_feedback(department=self.department, service=self.service, location=self.location)
        item = api_client(self.admin).get(FEEDBACK_URL).data["results"][0]
        self.assertRegex(item["created_at"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")

    def test_cors_preflight_allows_authorization_and_idempotency_key(self):
        response = self.client.options(
            FEEDBACK_URL,
            HTTP_ORIGIN="http://localhost:3000",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization,content-type,idempotency-key",
        )
        self.assertIn(response.status_code, (200, 204))
        allow_headers = response["Access-Control-Allow-Headers"].lower()
        self.assertIn("authorization", allow_headers)
        self.assertIn("idempotency-key", allow_headers)
