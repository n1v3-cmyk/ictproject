"""Attachment validation (count, size, type) — mirrored on the client, server wins.

Limits follow the spec/FR-1.8 and the contract's create-feedback table:
≤ 5 files, ≤ 8 MB each, JPG / PNG / WebP / PDF / MP4.
"""

from __future__ import annotations

import os

from rest_framework.exceptions import APIException, ValidationError

MAX_ATTACHMENTS = 5
MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_MIME_TYPES = frozenset(
    {"image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"}
)
ALLOWED_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".webp", ".pdf", ".mp4"})


class PayloadTooLarge(APIException):
    status_code = 413
    default_detail = "One or more attachments exceed the 8 MB limit."
    default_code = "payload_too_large"


class UnsupportedAttachmentType(APIException):
    status_code = 415
    default_detail = "Unsupported attachment type. Use JPG, PNG, WebP, PDF, or MP4."
    default_code = "unsupported_media_type"


def validate_attachments(files) -> None:
    """Raise the appropriate DRF exception if any file is unacceptable."""
    files = list(files)
    if len(files) > MAX_ATTACHMENTS:
        raise ValidationError(
            {"attachments": [f"Up to {MAX_ATTACHMENTS} files are allowed."]}
        )

    for uploaded in files:
        if uploaded.size > MAX_ATTACHMENT_BYTES:
            raise PayloadTooLarge(
                f"Attachment {uploaded.name!r} exceeds the 8 MB limit."
            )

        content_type = (getattr(uploaded, "content_type", "") or "").lower()
        extension = os.path.splitext(uploaded.name or "")[1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise UnsupportedAttachmentType(
                f"Attachment {uploaded.name!r} has an unsupported extension."
            )
        # Allow a missing content type (fall back to the extension), but reject a
        # declared type that is not permitted.
        if content_type and content_type not in ALLOWED_MIME_TYPES:
            raise UnsupportedAttachmentType(
                f"Attachment {uploaded.name!r} has an unsupported content type."
            )
