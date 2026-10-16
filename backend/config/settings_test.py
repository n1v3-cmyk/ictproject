"""Test settings: run against in-memory SQLite so the suite needs no server.

The production/default configuration remains PostgreSQL (see ``config.settings``).
Use with: ``python manage.py test --settings=config.settings_test``.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

from config.settings import *  # noqa: F401,F403  (re-export base settings)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Keep attachment writes out of the repository during tests.
MEDIA_ROOT = Path(tempfile.mkdtemp(prefix="civicconnect-test-media-"))

# Faster, still-correct password hashing for tests only.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
