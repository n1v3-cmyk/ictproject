"""Interchangeable sentiment analysis.

The public surface is :func:`analyze_sentiment`. Today it is a transparent,
rule-based ``heuristic-v1`` baseline (curated lexicon + ratings). It is **not** a
trained model and must never be presented as AI.

To adopt a trained model later, replace the body of :func:`analyze_sentiment`
(and change ``SENTIMENT_METHOD``) without touching any caller. The labels and
scoring rules intentionally mirror ``frontend/src/domain/sentiment.ts`` so the
mock and real backends agree.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

SENTIMENT_METHOD = "heuristic-v1"

POSITIVE_KEYWORDS = [
    "fast", "quick", "efficient", "helpful", "prompt", "smooth", "excellent",
    "great", "polite", "courteous", "transparent", "solved", "resolved", "satisfied",
    "well-maintained", "friendly", "clear", "easy", "seamless", "timely", "professional",
    "thank", "applaud", "appreciated", "supportive", "clean", "improved", "organized",
]

NEGATIVE_KEYWORDS = [
    "delay", "delayed", "slow", "rude", "unhelpful", "bribe", "corrupt", "harassed",
    "queue", "waiting", "broken", "server down", "glitch", "error", "refused",
    "crowded", "unresponsive", "terrible", "worst", "failed", "complaint",
    "leakage", "outage", "dirty", "ignored", "arrogant", "misinformed", "complicated",
    "frustrated", "poor", "useless", "harassment", "long line", "harsh",
]


def _js_round(value: float) -> int:
    """Reproduce JavaScript's ``Math.round`` (half rounds up, not banker's)."""
    return math.floor(value + 0.5)


@dataclass(frozen=True)
class SentimentResult:
    sentiment: str  # 'positive' | 'neutral' | 'negative'
    score: int  # 0..100 (0 most negative, 50 neutral, 100 most positive)
    detected_keywords: list[str] = field(default_factory=list)
    method: str = SENTIMENT_METHOD
    status: str = "completed"  # 'completed' | 'failed'
    explanation: str = ""


def analyze_sentiment(text: str, overall_rating: int, category_average: float) -> SentimentResult:
    """Classify feedback text + ratings into a sentiment label and 0-100 score.

    Deterministic and exception-safe: analysis must never break submission, so any
    failure degrades to a neutral result with ``status='failed'``.
    """
    try:
        normalized = (text or "").lower()

        found_positives = [kw for kw in POSITIVE_KEYWORDS if kw in normalized]
        found_negatives = [kw for kw in NEGATIVE_KEYWORDS if kw in normalized]

        keyword_diff = len(found_positives) - len(found_negatives)

        # Rating contribution: average of overall + category ratings, mapped to -2..+2.
        rating_weight = (overall_rating + category_average) / 2 - 3
        composite_score = rating_weight * 1.5 + keyword_diff

        if composite_score >= 0.8 or (overall_rating >= 4 and not found_negatives):
            sentiment = "positive"
            score = min(98, _js_round(65 + composite_score * 10))
        elif composite_score <= -0.8 or (overall_rating <= 2 and not found_positives):
            sentiment = "negative"
            score = max(8, _js_round(35 + composite_score * 10))
        else:
            sentiment = "neutral"
            score = _js_round(50 + composite_score * 5)

        score = max(0, min(100, score))

        detected = list(dict.fromkeys([*found_positives, *found_negatives]))

        if not normalized.strip():
            explanation = "No text supplied; classified from ratings only."
        elif sentiment == "positive":
            explanation = (
                f"Positive evaluation from {len(found_positives)} constructive "
                f"indicator(s) and a {overall_rating}/5 rating."
            )
        elif sentiment == "negative":
            explanation = (
                f"Concern flagged from {len(found_negatives)} friction keyword(s) "
                f"and a {overall_rating}/5 rating."
            )
        else:
            explanation = f"Balanced or neutral feedback with a {overall_rating}/5 rating."

        return SentimentResult(
            sentiment=sentiment,
            score=score,
            detected_keywords=detected,
            status="completed",
            explanation=explanation,
        )
    except Exception:  # pragma: no cover - defensive; must never raise
        return SentimentResult(
            sentiment="neutral",
            score=50,
            detected_keywords=[],
            status="failed",
            explanation="Sentiment analysis failed; defaulted to neutral.",
        )
