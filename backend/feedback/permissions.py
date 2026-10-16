"""Permissions.

The project default is ``IsAuthenticated`` (see settings); public endpoints opt in
to ``AllowAny``. Admin-only endpoints use DRF's ``IsAdminUser``, which yields
``401`` for anonymous callers and ``403`` for authenticated non-staff users — the
behaviour required by ``docs/api-contract.md`` §9.
"""

from rest_framework.permissions import AllowAny, IsAdminUser  # noqa: F401

__all__ = ["AllowAny", "IsAdminUser"]
