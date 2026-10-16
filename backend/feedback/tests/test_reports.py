"""CSV export: columns, escaping, filename, permissions, and count parity."""

from __future__ import annotations

import csv
import io

from django.test import TestCase

from feedback.tests.factories import (
    api_client,
    make_admin,
    make_department,
    make_feedback,
    make_location,
    make_service,
)

EXPORT_URL = "/api/v1/reports/export/"
FEEDBACK_URL = "/api/v1/feedback/"

EXPECTED_COLUMNS = [
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


class ReportExportTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.client = api_client(self.admin)
        self.department = make_department(code="MVD", name="Motor Vehicles")
        self.service = make_service(self.department, code="MVD-01", name="Licence Renewal")
        self.location = make_location()

    def _csv_rows(self, response):
        text = response.content.decode("utf-8")
        return list(csv.reader(io.StringIO(text)))

    def test_requires_admin(self):
        self.assertEqual(api_client().get(EXPORT_URL).status_code, 401)

    def test_content_type_and_filename(self):
        response = self.client.get(EXPORT_URL, {"format": "csv"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response["Content-Type"].startswith("text/csv"))
        self.assertRegex(
            response["Content-Disposition"], r'attachment; filename="civicconnect-feedback-\d{4}-\d{2}-\d{2}\.csv"'
        )

    def test_header_matches_contract(self):
        rows = self._csv_rows(self.client.get(EXPORT_URL, {"format": "csv"}))
        self.assertEqual(rows[0], EXPECTED_COLUMNS)

    def test_row_count_matches_filtered_feedback(self):
        for _ in range(3):
            make_feedback(department=self.department, service=self.service, location=self.location)
        other_service = make_service(self.department, code="MVD-02")
        make_feedback(department=self.department, service=other_service, location=self.location)

        list_count = self.client.get(FEEDBACK_URL).data["count"]
        export_rows = self._csv_rows(self.client.get(EXPORT_URL, {"format": "csv"}))
        self.assertEqual(len(export_rows) - 1, list_count)

        filtered = self.client.get(FEEDBACK_URL, {"service": str(other_service.id)}).data["count"]
        filtered_rows = self._csv_rows(
            self.client.get(EXPORT_URL, {"format": "csv", "service": str(other_service.id)})
        )
        self.assertEqual(len(filtered_rows) - 1, filtered)

    def test_csv_escaping_of_commas_quotes_and_newlines(self):
        tricky = 'A comment with a comma, a "quote" and a newline\nhere, plainly.'
        make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            summary="Placeholder summary that is long enough.",
            detailed=tricky,
        )
        # Put the tricky text in the summary column so we can assert round-tripping.
        feedback = make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            summary='Comma, "quoted", and\nnewline summary text.',
        )
        rows = self._csv_rows(self.client.get(EXPORT_URL, {"format": "csv"}))
        comments = [row[13] for row in rows[1:]]
        self.assertIn(feedback.summary_comment, comments)

    def test_anonymous_column_is_yes_no(self):
        make_feedback(
            department=self.department, service=self.service, location=self.location, is_anonymous=True
        )
        make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            is_anonymous=False,
            citizen_name="Named Citizen",
            summary="A distinct identified summary comment.",
        )
        rows = self._csv_rows(self.client.get(EXPORT_URL, {"format": "csv"}))
        anonymous_values = {row[14] for row in rows[1:]}
        self.assertEqual(anonymous_values, {"yes", "no"})

    def test_no_identity_column_exists(self):
        rows = self._csv_rows(self.client.get(EXPORT_URL, {"format": "csv"}))
        self.assertNotIn("citizen_name", rows[0])
        self.assertNotIn("citizen_contact", rows[0])
