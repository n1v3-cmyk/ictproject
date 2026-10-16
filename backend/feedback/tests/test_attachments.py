"""Attachment validation (count/size/type) and admin-only download."""

from __future__ import annotations

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from feedback.models import FeedbackAttachment
from feedback.tests.factories import (
    api_client,
    make_admin,
    make_department,
    make_feedback,
    make_location,
    make_service,
    valid_payload,
)

FEEDBACK_URL = "/api/v1/feedback/"


def png(name: str = "photo.png") -> SimpleUploadedFile:
    return SimpleUploadedFile(name, b"\x89PNG\r\n\x1a\n" + b"0" * 16, content_type="image/png")


class AttachmentValidationTests(TestCase):
    def setUp(self):
        self.department = make_department(code="REV")
        self.service = make_service(self.department, code="REV-01")
        self.payload = valid_payload(self.department, self.service)

    def post(self, files):
        return api_client().post(FEEDBACK_URL, {**self.payload, "attachments": files}, format="multipart")

    def test_valid_attachment_is_accepted(self):
        response = self.post([png()])
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(FeedbackAttachment.objects.count(), 1)

    def test_too_many_attachments_is_400(self):
        response = self.post([png(f"p{i}.png") for i in range(6)])
        self.assertEqual(response.status_code, 400)
        self.assertIn("attachments", response.data)

    def test_unsupported_type_is_415(self):
        bad = SimpleUploadedFile("script.exe", b"MZ", content_type="application/x-msdownload")
        response = self.post([bad])
        self.assertEqual(response.status_code, 415)

    @override_settings(DATA_UPLOAD_MAX_NUMBER_FILES=50)
    def test_oversized_attachment_is_413(self):
        big = SimpleUploadedFile("big.png", b"\x89PNG\r\n\x1a\n" + b"0" * (8 * 1024 * 1024 + 1), content_type="image/png")
        response = self.post([big])
        self.assertEqual(response.status_code, 413)

    def test_multiple_valid_attachments(self):
        response = self.post([png("a.png"), png("b.png"), png("c.png")])
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(response.data["attachments"]), 3)


class AttachmentDownloadTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.department = make_department(code="REV")
        self.service = make_service(self.department, code="REV-01")
        self.feedback = make_feedback(
            department=self.department, service=self.service, location=make_location()
        )
        self.attachment = FeedbackAttachment.objects.create(
            feedback=self.feedback,
            file=png("evidence.png"),
            file_name="evidence.png",
            mime_type="image/png",
            size_bytes=24,
        )

    def test_download_requires_admin(self):
        response = api_client().get(f"/api/v1/attachments/{self.attachment.id}/")
        self.assertEqual(response.status_code, 401)

    def test_admin_can_download(self):
        response = api_client(self.admin).get(f"/api/v1/attachments/{self.attachment.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertIn("attachment", response["Content-Disposition"])

    def test_missing_attachment_is_404(self):
        response = api_client(self.admin).get("/api/v1/attachments/00000000-0000-0000-0000-0000000000ff/")
        self.assertEqual(response.status_code, 404)

    def test_invalid_token_is_rejected(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Token not-a-real-token")
        response = client.get(f"/api/v1/attachments/{self.attachment.id}/")
        self.assertEqual(response.status_code, 401)
