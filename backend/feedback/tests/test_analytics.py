"""Analytics: rounding, ordering, hotspot thresholds, and null-coordinate handling."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone

from django.test import SimpleTestCase

from feedback import analytics
from feedback.analytics import FeedbackRow


@dataclass
class Dept:
    id: str
    code: str
    name: str


def row(
    *,
    sentiment: str,
    rating: int = 3,
    district: str = "Ernakulam",
    department_id: str = "d1",
    department_name: str = "Dept One",
    keywords: tuple[str, ...] = (),
    created_at: datetime | None = None,
    latitude: float | None = 9.97,
    longitude: float | None = 76.28,
) -> FeedbackRow:
    return FeedbackRow(
        sentiment=sentiment,
        overall_rating=rating,
        created_at=created_at or datetime(2026, 10, 1, 9, 0, tzinfo=dt_timezone.utc),
        department_id=department_id,
        department_name=department_name,
        keywords=keywords,
        district=district,
        latitude=latitude,
        longitude=longitude,
    )


class RoundingTests(SimpleTestCase):
    def test_round1_and_round2_match_javascript(self):
        self.assertEqual(analytics.round1(2.25), 2.3)
        self.assertEqual(analytics.round2(3.725), 3.73)
        # Float representation: 1.005*100 == 100.49999999999999, which JS also
        # rounds down to 1.0 — the backend must agree with the frontend.
        self.assertEqual(analytics.round2(1.005), 1.0)


class SummaryTests(SimpleTestCase):
    def test_counts_and_percentages(self):
        rows = [
            row(sentiment="positive", rating=5),
            row(sentiment="positive", rating=4),
            row(sentiment="neutral", rating=3),
            row(sentiment="negative", rating=1),
        ]
        self.assertEqual(
            analytics.count_sentiment(rows), {"positive": 2, "neutral": 1, "negative": 1}
        )
        self.assertEqual(analytics.sentiment_percentages(rows), {"positive": 50, "neutral": 25, "negative": 25})
        self.assertEqual(analytics.average_rating(rows), 3.25)

    def test_empty_percentages_are_zero(self):
        self.assertEqual(
            analytics.sentiment_percentages([]), {"positive": 0, "neutral": 0, "negative": 0}
        )
        self.assertEqual(analytics.average_rating([]), 0)

    def test_volume_over_time_is_sorted_ascending(self):
        rows = [
            row(sentiment="positive", created_at=datetime(2026, 10, 3, tzinfo=dt_timezone.utc)),
            row(sentiment="negative", created_at=datetime(2026, 10, 1, tzinfo=dt_timezone.utc)),
            row(sentiment="neutral", created_at=datetime(2026, 10, 1, tzinfo=dt_timezone.utc)),
        ]
        volume = analytics.volume_over_time(rows)
        self.assertEqual([point["date"] for point in volume], ["2026-10-01", "2026-10-03"])
        self.assertEqual(volume[0]["total"], 2)
        self.assertEqual(volume[0]["negative"], 1)

    def test_department_comparison_sorted_by_count_and_skips_empty(self):
        departments = [
            Dept(id="d1", code="A", name="Alpha"),
            Dept(id="d2", code="B", name="Beta"),
            Dept(id="d3", code="C", name="Gamma"),
        ]
        rows = [
            row(sentiment="positive", department_id="d2", department_name="Beta"),
            row(sentiment="neutral", department_id="d2", department_name="Beta"),
            row(sentiment="negative", department_id="d1", department_name="Alpha"),
        ]
        comparison = analytics.department_comparison(rows, departments)
        self.assertEqual([item["code"] for item in comparison], ["B", "A"])
        self.assertEqual(comparison[0]["count"], 2)
        self.assertNotIn("Gamma", [item["name"] for item in comparison])

    def test_top_concerns_only_negative_lexicon_terms(self):
        rows = [
            row(sentiment="negative", keywords=("delay", "rude", "positive-only-word")),
            row(sentiment="negative", keywords=("delay",)),
            row(sentiment="positive", keywords=("delay",)),
        ]
        concerns = analytics.top_concerns(rows)
        terms = {item["term"]: item for item in concerns}
        self.assertEqual(terms["delay"]["negative_count"], 2)
        self.assertIn("rude", terms)
        self.assertNotIn("positive-only-word", terms)

    def test_top_commendations_only_positive_rows(self):
        rows = [
            row(sentiment="positive", keywords=("helpful", "fast")),
            row(sentiment="positive", keywords=("helpful",)),
            row(sentiment="negative", keywords=("helpful",)),
        ]
        commendations = analytics.top_commendations(rows)
        self.assertEqual(commendations[0], {"term": "helpful", "count": 2})

    def test_summarize_shape(self):
        departments = [Dept(id="d1", code="A", name="Alpha")]
        summary = analytics.summarize([row(sentiment="positive", department_id="d1")], departments)
        self.assertEqual(
            set(summary),
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
        self.assertEqual(summary["sentiment_method"], "heuristic-v1")
        self.assertEqual(summary["total_feedback"], 1)


class GeographicTests(SimpleTestCase):
    def test_null_coordinates_are_preserved(self):
        rows = [row(sentiment="neutral", district="Wayanad", latitude=None, longitude=None)]
        aggregates = analytics.geographic_aggregates(rows)
        self.assertEqual(len(aggregates), 1)
        self.assertIsNone(aggregates[0]["latitude"])
        self.assertIsNone(aggregates[0]["longitude"])
        self.assertIsNone(aggregates[0]["local_area"])

    def test_first_known_coordinate_is_kept(self):
        rows = [
            row(sentiment="neutral", district="Kollam", latitude=None, longitude=None),
            row(sentiment="neutral", district="Kollam", latitude=8.89, longitude=76.61),
        ]
        aggregates = analytics.geographic_aggregates(rows)
        self.assertEqual(aggregates[0]["latitude"], 8.89)

    def test_hotspot_levels(self):
        low = analytics.geographic_aggregates([row(sentiment="positive", rating=5, district="L")])
        self.assertEqual(low[0]["hotspot_level"], "low")

        # A single negative among several positives: avg 3.0, negative ratio 0.2.
        moderate = analytics.geographic_aggregates(
            [
                row(sentiment="positive", rating=3, district="M"),
                row(sentiment="positive", rating=3, district="M"),
                row(sentiment="positive", rating=3, district="M"),
                row(sentiment="positive", rating=3, district="M"),
                row(sentiment="negative", rating=3, district="M"),
            ]
        )
        self.assertEqual(moderate[0]["hotspot_level"], "moderate")

        high = analytics.geographic_aggregates(
            [
                row(sentiment="negative", rating=1, district="H"),
                row(sentiment="negative", rating=2, district="H"),
            ]
        )
        self.assertEqual(high[0]["hotspot_level"], "high")

    def test_aggregates_sorted_by_total(self):
        rows = [
            row(sentiment="neutral", district="A"),
            row(sentiment="neutral", district="B"),
            row(sentiment="neutral", district="B"),
        ]
        aggregates = analytics.geographic_aggregates(rows)
        self.assertEqual([item["district"] for item in aggregates], ["B", "A"])

    def test_average_rating_rounded_to_one_decimal(self):
        rows = [
            row(sentiment="positive", rating=4, district="A"),
            row(sentiment="positive", rating=3, district="A"),
            row(sentiment="positive", rating=4, district="A"),
        ]
        aggregates = analytics.geographic_aggregates(rows)
        self.assertEqual(aggregates[0]["average_rating"], 3.7)


class InsightTests(SimpleTestCase):
    def test_insights_include_method_and_trends(self):
        departments = [Dept(id="d1", code="A", name="Alpha")]
        rows = [
            row(
                sentiment="negative",
                department_id="d1",
                department_name="Alpha",
                keywords=("delay",),
                created_at=datetime(2026, 8, 5, tzinfo=dt_timezone.utc),
            ),
            row(
                sentiment="negative",
                department_id="d1",
                department_name="Alpha",
                keywords=("delay",),
                created_at=datetime(2026, 9, 5, tzinfo=dt_timezone.utc),
            ),
        ]
        insights = analytics.derive_insights(rows, departments)
        self.assertEqual(insights["method"], analytics.CONCERN_METHOD)
        self.assertEqual([trend["period"] for trend in insights["trends"]], ["2026-08", "2026-09"])
        self.assertIsNone(insights["trends"][0]["delta_vs_previous"])
        concerns = {item["term"]: item for item in insights["recurring_concerns"]}
        self.assertEqual(concerns["delay"]["count"], 2)
        self.assertEqual(concerns["delay"]["departments"], ["Alpha"])
        self.assertIn(concerns["delay"]["trend"], {"rising", "falling", "stable"})


class PublicSummaryTests(SimpleTestCase):
    def _rows(self, district: str, count: int, sentiment: str, rating: int):
        return [
            row(sentiment=sentiment, rating=rating, district=district, department_id="d1")
            for _ in range(count)
        ]

    def test_shape_and_totals(self):
        departments = [Dept(id="d1", code="A", name="Alpha")]
        rows = self._rows("Ernakulam", 6, "positive", 5)
        summary = analytics.public_summary(rows, departments)
        self.assertEqual(
            set(summary),
            {
                "total_feedback",
                "average_rating",
                "sentiment",
                "sentiment_percentages",
                "districts_represented",
                "min_sample",
                "sentiment_method",
                "concern_level_note",
                "departments",
                "districts",
            },
        )
        self.assertEqual(summary["total_feedback"], 6)
        self.assertEqual(summary["districts_represented"], 1)
        self.assertEqual(summary["sentiment_method"], "heuristic-v1")
        self.assertEqual(summary["departments"][0]["code"], "A")

    def test_district_entry_is_aggregate_only(self):
        summary = analytics.public_summary(self._rows("Kollam", 8, "negative", 1), [])
        entry = summary["districts"][0]
        self.assertEqual(
            set(entry),
            {
                "district",
                "count",
                "average_rating",
                "sentiment",
                "sentiment_percentages",
                "concern_level",
                "low_sample",
                "latitude",
                "longitude",
            },
        )
        # Never carries free text or identity.
        self.assertNotIn("summary_comment", entry)
        self.assertNotIn("citizen_name", entry)

    def test_low_sample_masks_percentages_and_level(self):
        summary = analytics.public_summary(self._rows("Wayanad", 3, "negative", 1), [], min_sample=5)
        entry = summary["districts"][0]
        self.assertEqual(entry["count"], 3)
        self.assertTrue(entry["low_sample"])
        self.assertIsNone(entry["sentiment_percentages"])
        self.assertIsNone(entry["concern_level"])

    def test_at_threshold_is_not_masked(self):
        summary = analytics.public_summary(self._rows("Idukki", 5, "positive", 4), [], min_sample=5)
        entry = summary["districts"][0]
        self.assertFalse(entry["low_sample"])
        self.assertIsNotNone(entry["sentiment_percentages"])
        self.assertIsNotNone(entry["concern_level"])

    def test_null_coordinates_survive(self):
        rows = [row(sentiment="neutral", district="Wayanad", latitude=None, longitude=None)] * 6
        summary = analytics.public_summary(rows, [])
        self.assertIsNone(summary["districts"][0]["latitude"])

    def test_percentages_agree_with_admin_summary(self):
        rows = [
            row(sentiment="positive", rating=5, district="A"),
            row(sentiment="neutral", rating=3, district="A"),
            row(sentiment="negative", rating=1, district="A"),
            row(sentiment="positive", rating=4, district="A"),
        ]
        summary = analytics.public_summary(rows, [], min_sample=1)
        self.assertEqual(summary["sentiment_percentages"], analytics.sentiment_percentages(rows))
        self.assertEqual(summary["average_rating"], analytics.average_rating(rows))
