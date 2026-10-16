"""Reference-number generation: ``CC-KL-<year>-<n>`` (contract §3.2).

The numbering baseline matches the frontend mock (1100) so reference ids look the
same against either adapter. Collisions are impossible to persist thanks to the
unique constraint; ``services.create_feedback`` retries if one ever occurs.
"""

from __future__ import annotations

import re

from django.utils import timezone

REFERENCE_PATTERN = re.compile(r"CC-KL-(\d{4})-(\d+)")
REFERENCE_BASELINE = 1100
DEFAULT_STATE_CODE = "KL"


def max_reference_number() -> int:
    """Highest numeric suffix across existing reference ids (any year)."""
    from feedback.models import Feedback

    highest = REFERENCE_BASELINE
    for reference_id in Feedback.objects.values_list("reference_id", flat=True).iterator():
        match = REFERENCE_PATTERN.search(reference_id or "")
        if match:
            highest = max(highest, int(match.group(2)))
    return highest


def generate_reference_id(year: int | None = None) -> str:
    year = year or timezone.now().year
    return f"CC-{DEFAULT_STATE_CODE}-{year}-{max_reference_number() + 1}"
