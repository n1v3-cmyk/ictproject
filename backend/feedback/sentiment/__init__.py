"""Sentiment analysis package (replaceable module)."""

from feedback.sentiment.analyzer import (
    NEGATIVE_KEYWORDS,
    POSITIVE_KEYWORDS,
    SENTIMENT_METHOD,
    SentimentResult,
    analyze_sentiment,
)

__all__ = [
    "NEGATIVE_KEYWORDS",
    "POSITIVE_KEYWORDS",
    "SENTIMENT_METHOD",
    "SentimentResult",
    "analyze_sentiment",
]
