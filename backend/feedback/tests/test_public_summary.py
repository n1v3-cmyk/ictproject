"""Public aggregate summary endpoint: no login, aggregates only, small-sample safe."""

from __future__ import annotations

from django.test import TestCase

from feedback.tests.factories import (
    api_client,
    make_department,
    make_feedback,
    make_location,
    make_service,
)

PUBLIC_URL = "/api/v1/analytics/public-summary/"


class PublicSummaryApiTests(TestCase):
    def setUp(self):
        self.department = make_department(code="REV", name="Revenue & Land Records")
        self.service = make_service(self.department, code="REV-01", name="Mutation")
        self.ernakulam = make_location(district="Ernakulam", latitude=9.97, longitude=76.28)
        self.wayanad = make_location(
            district="Wayanad", local_area="Mananthavady", latitude=None, longitude=None
        )

    def _seed(self, count, district_location, sentiment_summary, rating):
        for _ in range(count):
            make_feedback(
                department=self.department,
                service=self.service,
                location=district_location,
                summary=sentiment_summary,
                overall=rating,
            )

    def test_no_login_required(self):
        response = api_client().get(PUBLIC_URL)
        self.assertEqual(response.status_code, 200)

    def test_empty_dataset_is_well_formed(self):
        data = api_client().get(PUBLIC_URL).data
        self.assertEqual(data["total_feedback"], 0)
        self.assertEqual(data["districts"], [])
        self.assertEqual(data["average_rating"], 0)

    def test_district_wise_sentiment(self):
        self._seed(6, self.ernakulam, "Excellent, fast and helpful service.", 5)
        self._seed(6, self.wayanad, "There was a long delay and it was rude.", 1)
        data = api_client().get(PUBLIC_URL).data

        self.assertEqual(data["total_feedback"], 12)
        self.assertEqual(data["districts_represented"], 2)
        by_district = {item["district"]: item for item in data["districts"]}
        self.assertEqual(by_district["Ernakulam"]["sentiment"]["positive"], 6)
        self.assertEqual(by_district["Ernakulam"]["concern_level"], "low")
        self.assertEqual(by_district["Wayanad"]["sentiment"]["negative"], 6)
        self.assertEqual(by_district["Wayanad"]["concern_level"], "high")

    def test_small_district_is_masked(self):
        self._seed(6, self.ernakulam, "Excellent and helpful.", 5)
        self._seed(2, self.wayanad, "Very slow and rude.", 1)
        data = api_client().get(PUBLIC_URL).data
        by_district = {item["district"]: item for item in data["districts"]}
        self.assertTrue(by_district["Wayanad"]["low_sample"])
        self.assertIsNone(by_district["Wayanad"]["sentiment_percentages"])
        self.assertIsNone(by_district["Wayanad"]["concern_level"])
        self.assertFalse(by_district["Ernakulam"]["low_sample"])

    def test_never_exposes_identity_or_comments(self):
        make_feedback(
            department=self.department,
            service=self.service,
            location=self.ernakulam,
            summary="A named citizen's identifiable comment text.",
            is_anonymous=False,
            citizen_name="Meera Nair",
        )
        body = api_client().get(PUBLIC_URL).content.decode("utf-8")
        self.assertNotIn("Meera Nair", body)
        self.assertNotIn("identifiable comment text", body)

    def test_neighbourhood_granularity_is_not_exposed(self):
        self._seed(6, self.ernakulam, "Helpful staff.", 4)
        data = api_client().get(PUBLIC_URL).data
        for entry in data["districts"]:
            self.assertNotIn("local_area", entry)

    def test_search_filter_is_ignored_so_names_cannot_be_probed(self):
        make_feedback(
            department=self.department,
            service=self.service,
            location=self.ernakulam,
            summary="Anonymous submission with distinctive wording.",
            is_anonymous=True,
            citizen_name="Meera Nair",
        )
        filtered = api_client().get(PUBLIC_URL, {"search": "Meera Nair"}).data
        baseline = api_client().get(PUBLIC_URL).data
        self.assertEqual(filtered["total_feedback"], baseline["total_feedback"])

    def test_safe_filters_are_honoured(self):
        self._seed(6, self.ernakulam, "Excellent and helpful.", 5)
        self._seed(6, self.wayanad, "Slow and rude.", 1)
        response = api_client().get(PUBLIC_URL, {"district": "Wayanad"})
        self.assertEqual(response.data["total_feedback"], 6)
        self.assertEqual([item["district"] for item in response.data["districts"]], ["Wayanad"])

    def test_totals_agree_with_admin_summary(self):
        self._seed(6, self.ernakulam, "Excellent and helpful.", 5)
        self._seed(6, self.wayanad, "Slow and rude.", 1)
        from feedback.tests.factories import make_admin

        admin = api_client(make_admin())
        public = api_client().get(PUBLIC_URL).data
        admin_summary = admin.get("/api/v1/analytics/summary/").data
        self.assertEqual(public["total_feedback"], admin_summary["total_feedback"])
        self.assertEqual(public["average_rating"], admin_summary["average_rating"])
        self.assertEqual(public["sentiment"], admin_summary["sentiment"])

    def test_invalid_safe_filter_still_400s(self):
        response = api_client().get(PUBLIC_URL, {"sentiment": "angry"})
        self.assertEqual(response.status_code, 400)
