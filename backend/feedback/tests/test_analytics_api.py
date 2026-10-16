"""Analytics endpoints: access control, shapes, and agreement with list counts."""

from django.test import TestCase

from feedback.tests.factories import (
    api_client,
    make_admin,
    make_department,
    make_feedback,
    make_location,
    make_service,
)

SUMMARY_URL = "/api/v1/analytics/summary/"
GEO_URL = "/api/v1/analytics/geographic/"
INSIGHTS_URL = "/api/v1/analytics/insights/"
FEEDBACK_URL = "/api/v1/feedback/"


class AnalyticsApiTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.client = api_client(self.admin)
        self.department = make_department(code="MVD", name="Motor Vehicles")
        self.service = make_service(self.department, code="MVD-01", name="Licence Renewal")
        self.location = make_location(district="Ernakulam", latitude=9.97, longitude=76.28)
        self.null_location = make_location(district="Wayanad", local_area="Mananthavady", latitude=None, longitude=None)

        make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            summary="There was a long delay and the staff were rude.",
            overall=1,
        )
        make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            summary="Fast, helpful and professional service.",
            overall=5,
        )
        make_feedback(
            department=self.department,
            service=self.service,
            location=self.null_location,
            summary="An acceptable and unremarkable experience.",
            overall=3,
        )

    def test_all_analytics_endpoints_require_admin(self):
        for url in (SUMMARY_URL, GEO_URL, INSIGHTS_URL):
            self.assertEqual(api_client().get(url).status_code, 401)

    def test_summary_shape_and_totals(self):
        response = self.client.get(SUMMARY_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data),
            {
                "total_feedback",
                "average_rating",
                "sentiment",
                "sentiment_percentages",
                "volume_over_time",
                "department_comparison",
                "top_concerns",
                "top_commendations",
                "sentiment_method",
            },
        )
        self.assertEqual(response.data["total_feedback"], 3)
        self.assertEqual(sum(response.data["sentiment"].values()), 3)
        self.assertEqual(response.data["sentiment_method"], "heuristic-v1")
        self.assertIn("delay", [item["term"] for item in response.data["top_concerns"]])

    def test_geographic_shape_and_null_coordinates(self):
        response = self.client.get(GEO_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"results"})
        by_district = {item["district"]: item for item in response.data["results"]}
        self.assertIsNone(by_district["Wayanad"]["latitude"])
        self.assertEqual(by_district["Ernakulam"]["latitude"], 9.97)
        for item in response.data["results"]:
            self.assertIn(item["hotspot_level"], {"low", "moderate", "high"})
            self.assertIsNone(item["local_area"])

    def test_insights_shape(self):
        response = self.client.get(INSIGHTS_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data), {"recurring_concerns", "department_comparison", "trends", "method"}
        )

    def test_counts_match_filtered_feedback_list(self):
        for params in ({}, {"district": "Ernakulam"}, {"sentiment": "negative"}):
            with self.subTest(params=params):
                list_count = self.client.get(FEEDBACK_URL, params).data["count"]
                summary_total = self.client.get(SUMMARY_URL, params).data["total_feedback"]
                self.assertEqual(list_count, summary_total)

    def test_summary_respects_filters(self):
        response = self.client.get(SUMMARY_URL, {"district": "Wayanad"})
        self.assertEqual(response.data["total_feedback"], 1)
