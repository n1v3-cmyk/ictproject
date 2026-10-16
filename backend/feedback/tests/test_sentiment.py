"""Sentiment module: labels, scores, and honest labelling."""

from django.test import SimpleTestCase

from feedback.sentiment import SENTIMENT_METHOD, analyze_sentiment
from feedback.sentiment.analyzer import _js_round


class SentimentTests(SimpleTestCase):
    def test_method_is_labelled_heuristic(self):
        result = analyze_sentiment("great service", 5, 5)
        self.assertEqual(result.method, SENTIMENT_METHOD)
        self.assertEqual(result.method, "heuristic-v1")
        self.assertEqual(result.status, "completed")

    def test_high_rating_with_no_negatives_is_positive(self):
        result = analyze_sentiment("", 5, 5)
        self.assertEqual(result.sentiment, "positive")
        # rating_weight = (5+5)/2 - 3 = 2 -> composite 3 -> min(98, round(95)) = 95
        self.assertEqual(result.score, 95)

    def test_low_rating_with_no_positives_is_negative(self):
        result = analyze_sentiment("", 1, 1)
        self.assertEqual(result.sentiment, "negative")
        # rating_weight = -2 -> composite -3 -> max(8, round(5)) = 8
        self.assertEqual(result.score, 8)

    def test_middle_rating_is_neutral(self):
        result = analyze_sentiment("", 3, 3)
        self.assertEqual(result.sentiment, "neutral")
        self.assertEqual(result.score, 50)

    def test_negative_keywords_detected(self):
        result = analyze_sentiment("There was a long delay and the staff were rude.", 2, 2)
        self.assertEqual(result.sentiment, "negative")
        self.assertIn("delay", result.detected_keywords)
        self.assertIn("rude", result.detected_keywords)

    def test_positive_keywords_detected(self):
        result = analyze_sentiment("Fast, helpful and professional staff.", 5, 5)
        self.assertEqual(result.sentiment, "positive")
        self.assertTrue({"helpful", "professional", "fast"} <= set(result.detected_keywords))

    def test_keyword_order_is_positives_then_negatives(self):
        result = analyze_sentiment("helpful but slow", 3, 3)
        # POSITIVE_KEYWORDS lists 'helpful'; NEGATIVE_KEYWORDS lists 'slow'.
        self.assertEqual(result.detected_keywords, ["helpful", "slow"])

    def test_score_always_within_bounds(self):
        cases = [
            ("", 1, 1),
            ("", 5, 5),
            ("excellent great helpful fast smooth timely", 5, 5),
            ("delay rude slow terrible worst failed corrupt bribe", 1, 1),
        ]
        for text, overall, category in cases:
            result = analyze_sentiment(text, overall, category)
            self.assertGreaterEqual(result.score, 0)
            self.assertLessEqual(result.score, 100)

    def test_high_rating_with_negative_keywords_is_not_forced_positive(self):
        # The `overall_rating >= 4` positive shortcut must not apply when negatives
        # are present and drag the composite score below the neutral band.
        result = analyze_sentiment("slow rude broken and a long line", 4, 4)
        self.assertEqual(result.sentiment, "negative")

    def test_none_text_does_not_raise(self):
        result = analyze_sentiment(None, 3, 3)  # type: ignore[arg-type]
        self.assertIn(result.sentiment, {"positive", "neutral", "negative"})
        self.assertEqual(result.status, "completed")

    def test_js_round_matches_javascript(self):
        self.assertEqual(_js_round(0.5), 1)
        self.assertEqual(_js_round(1.5), 2)
        self.assertEqual(_js_round(2.5), 3)
        self.assertEqual(_js_round(-0.5), 0)
        self.assertEqual(_js_round(-1.5), -1)
        self.assertEqual(_js_round(28.999999), 29)
