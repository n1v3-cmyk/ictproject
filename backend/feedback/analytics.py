"""Aggregation and insight derivation.

Pure, framework-free functions over lightweight :class:`FeedbackRow` values. They
mirror ``frontend/src/domain/analytics.ts`` exactly (same rounding, ordering and
thresholds) so the mock adapter and the real API agree — including edge cases
such as ties and empty result sets.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone

from feedback.sentiment import NEGATIVE_KEYWORDS, POSITIVE_KEYWORDS, SENTIMENT_METHOD

#: Documented heuristic label returned by ``/analytics/insights/``.
CONCERN_METHOD = (
    "frequency + negative-association over curated lexicon, "
    "windowed by date_from/date_to"
)

NEGATIVE_SET = frozenset(NEGATIVE_KEYWORDS)
POSITIVE_SET = frozenset(POSITIVE_KEYWORDS)


def _js_round(value: float) -> int:
    """Match JavaScript's ``Math.round`` (used throughout the frontend)."""
    return math.floor(value + 0.5)


def round1(value: float) -> float:
    return _js_round(value * 10) / 10


def round2(value: float) -> float:
    return _js_round(value * 100) / 100


@dataclass(frozen=True)
class FeedbackRow:
    """The minimal per-record projection analytics needs."""

    sentiment: str
    overall_rating: int
    created_at: datetime
    department_id: str
    department_name: str
    keywords: tuple[str, ...]
    district: str
    latitude: float | None
    longitude: float | None


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=dt_timezone.utc)
    return value.astimezone(dt_timezone.utc)


def count_sentiment(rows: list[FeedbackRow]) -> dict[str, int]:
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    for row in rows:
        if row.sentiment in counts:
            counts[row.sentiment] += 1
    return counts


def average_rating(rows: list[FeedbackRow]) -> float:
    if not rows:
        return 0
    return round2(sum(row.overall_rating for row in rows) / len(rows))


def percentages_from_counts(counts: dict[str, int], total: int) -> dict[str, int]:
    def pct(count: int) -> int:
        return 0 if total == 0 else _js_round((count / total) * 100)

    return {
        "positive": pct(counts["positive"]),
        "neutral": pct(counts["neutral"]),
        "negative": pct(counts["negative"]),
    }


def sentiment_percentages(rows: list[FeedbackRow]) -> dict[str, int]:
    return percentages_from_counts(count_sentiment(rows), len(rows))


def volume_over_time(rows: list[FeedbackRow]) -> list[dict]:
    by_date: dict[str, dict] = {}
    for row in rows:
        date = _utc(row.created_at).date().isoformat()
        point = by_date.setdefault(
            date, {"date": date, "positive": 0, "neutral": 0, "negative": 0, "total": 0}
        )
        if row.sentiment in point:
            point[row.sentiment] += 1
        point["total"] += 1
    return [by_date[key] for key in sorted(by_date)]


def department_comparison(rows: list[FeedbackRow], departments) -> list[dict]:
    comparison = []
    for dept in departments:
        dept_id = str(dept.id)
        items = [row for row in rows if row.department_id == dept_id]
        if not items:
            continue
        comparison.append(
            {
                "department_id": dept_id,
                "code": dept.code,
                "name": dept.name,
                "average_rating": average_rating(items),
                "count": len(items),
            }
        )
    # Stable sort by count desc keeps the department ordering for ties.
    comparison.sort(key=lambda item: item["count"], reverse=True)
    return comparison


def top_concerns(rows: list[FeedbackRow], limit: int = 6) -> list[dict]:
    by_term: dict[str, dict] = {}
    for row in rows:
        if row.sentiment != "negative":
            continue
        for keyword in row.keywords:
            if keyword not in NEGATIVE_SET:
                continue
            entry = by_term.setdefault(
                keyword, {"term": keyword, "count": 0, "negative_count": 0, "departments": []}
            )
            entry["count"] += 1
            entry["negative_count"] += 1
            if row.department_name not in entry["departments"]:
                entry["departments"].append(row.department_name)
    ordered = sorted(by_term.values(), key=lambda item: (-item["negative_count"], item["term"]))
    return ordered[:limit]


def top_commendations(rows: list[FeedbackRow], limit: int = 6) -> list[dict]:
    counts: dict[str, int] = {}
    for row in rows:
        if row.sentiment != "positive":
            continue
        for keyword in row.keywords:
            if keyword in POSITIVE_SET:
                counts[keyword] = counts.get(keyword, 0) + 1
    ordered = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return [{"term": term, "count": count} for term, count in ordered[:limit]]


def summarize(rows: list[FeedbackRow], departments) -> dict:
    return {
        "total_feedback": len(rows),
        "average_rating": average_rating(rows),
        "sentiment": count_sentiment(rows),
        "sentiment_percentages": sentiment_percentages(rows),
        "volume_over_time": volume_over_time(rows),
        "department_comparison": department_comparison(rows, departments),
        "top_concerns": [
            {"term": item["term"], "count": item["count"], "negative_count": item["negative_count"]}
            for item in top_concerns(rows)
        ],
        "top_commendations": top_commendations(rows),
        "sentiment_method": SENTIMENT_METHOD,
    }


def _hotspot_level(average: float, negative_ratio: float) -> str:
    if average < 2.8 or negative_ratio >= 0.4:
        return "high"
    if average < 3.8 or negative_ratio > 0:
        return "moderate"
    return "low"


def geographic_aggregates(rows: list[FeedbackRow]) -> list[dict]:
    """Aggregate by district. Coordinates are never fabricated: a district with no
    known coordinate set is returned with ``latitude``/``longitude`` ``null``."""
    by_district: dict[str, dict] = {}
    for row in rows:
        aggregate = by_district.get(row.district)
        if aggregate is None:
            aggregate = {
                "district": row.district,
                "local_area": None,
                "latitude": None,
                "longitude": None,
                "total": 0,
                "average_rating": 0,
                "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
                "hotspot_level": "low",
                "_rating_sum": 0,
            }
            by_district[row.district] = aggregate
        if row.sentiment in aggregate["sentiment"]:
            aggregate["sentiment"][row.sentiment] += 1
        aggregate["total"] += 1
        aggregate["_rating_sum"] += row.overall_rating
        # Keep the first known coordinate set; never invent one.
        if aggregate["latitude"] is None and row.latitude is not None:
            aggregate["latitude"] = row.latitude
            aggregate["longitude"] = row.longitude

    results = []
    for aggregate in by_district.values():
        total = aggregate.pop("_rating_sum")
        average = round1(total / aggregate["total"]) if aggregate["total"] else 0
        aggregate["average_rating"] = average
        aggregate["hotspot_level"] = _hotspot_level(
            average, aggregate["sentiment"]["negative"] / aggregate["total"]
        )
        results.append(aggregate)
    results.sort(key=lambda item: item["total"], reverse=True)
    return results


def _concern_trends(rows: list[FeedbackRow], terms: list[str]) -> dict[str, str]:
    """Compare each term's count in the latest month present to the previous one."""
    months = sorted({_utc(row.created_at).strftime("%Y-%m") for row in rows})
    if len(months) < 2:
        return {term: "stable" for term in terms}
    previous_month, latest_month = months[-2], months[-1]

    counts = {term: {previous_month: 0, latest_month: 0} for term in terms}
    for row in rows:
        month = _utc(row.created_at).strftime("%Y-%m")
        if month not in (previous_month, latest_month):
            continue
        for keyword in row.keywords:
            if keyword in counts:
                counts[keyword][month] += 1

    trends: dict[str, str] = {}
    for term in terms:
        latest, previous = counts[term][latest_month], counts[term][previous_month]
        if latest > previous:
            trends[term] = "rising"
        elif latest < previous:
            trends[term] = "falling"
        else:
            trends[term] = "stable"
    return trends


def derive_insights(rows: list[FeedbackRow], departments) -> dict:
    by_month: dict[str, list[FeedbackRow]] = {}
    for row in rows:
        period = _utc(row.created_at).strftime("%Y-%m")
        by_month.setdefault(period, []).append(row)

    periods = sorted(by_month)
    trends = []
    for index, period in enumerate(periods):
        average = average_rating(by_month[period])
        previous = average_rating(by_month[periods[index - 1]]) if index > 0 else None
        trends.append(
            {
                "period": period,
                "total": len(by_month[period]),
                "average_rating": average,
                "delta_vs_previous": None if previous is None else round2(average - previous),
            }
        )

    concerns = top_concerns(rows, 10)
    trend_by_term = _concern_trends(rows, [item["term"] for item in concerns])
    for item in concerns:
        item["trend"] = trend_by_term.get(item["term"], "stable")

    return {
        "recurring_concerns": concerns,
        "department_comparison": department_comparison(rows, departments),
        "trends": trends,
        "method": CONCERN_METHOD,
    }


#: Districts with fewer submissions than this are shown without percentages or a
#: concern level, so a very small group of citizens cannot be inferred.
PUBLIC_MIN_SAMPLE = 5

#: Public framing for the hotspot indicator — a concentration signal, not a verdict.
CONCERN_LEVEL_NOTE = (
    "Concern level is a concentration indicator derived from ratings and sentiment "
    "within the selected window. It is a heuristic signal, not proof that a district "
    "receives poor service."
)


def public_summary(
    rows: list[FeedbackRow],
    departments,
    min_sample: int = PUBLIC_MIN_SAMPLE,
) -> dict:
    """Aggregate-only, non-identifying statistics safe to serve without a login.

    Returns overall totals, per-department averages, and a **district-wise**
    sentiment breakdown. It never exposes individual records, comments, or citizen
    identity, and it never resolves below district granularity. Districts below
    ``min_sample`` keep their ``count`` but report ``sentiment_percentages`` and
    ``concern_level`` as ``null`` with ``low_sample: true``.
    """
    districts = []
    for aggregate in geographic_aggregates(rows):
        count = aggregate["total"]
        low_sample = count < min_sample
        districts.append(
            {
                "district": aggregate["district"],
                "count": count,
                "average_rating": aggregate["average_rating"],
                "sentiment": aggregate["sentiment"],
                "sentiment_percentages": (
                    None
                    if low_sample
                    else percentages_from_counts(aggregate["sentiment"], count)
                ),
                "concern_level": None if low_sample else aggregate["hotspot_level"],
                "low_sample": low_sample,
                "latitude": aggregate["latitude"],
                "longitude": aggregate["longitude"],
            }
        )

    return {
        "total_feedback": len(rows),
        "average_rating": average_rating(rows),
        "sentiment": count_sentiment(rows),
        "sentiment_percentages": sentiment_percentages(rows),
        "districts_represented": len(districts),
        "min_sample": min_sample,
        "sentiment_method": SENTIMENT_METHOD,
        "concern_level_note": CONCERN_LEVEL_NOTE,
        "departments": department_comparison(rows, departments),
        "districts": districts,
    }
