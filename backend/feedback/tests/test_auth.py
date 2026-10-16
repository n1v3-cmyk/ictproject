"""Authentication and authorization semantics (contract §2 and §9)."""

from django.test import TestCase

from feedback.tests.factories import api_client, make_admin

LOGIN_URL = "/api/v1/auth/login/"
LOGOUT_URL = "/api/v1/auth/logout/"
ME_URL = "/api/v1/auth/me/"
FEEDBACK_URL = "/api/v1/feedback/"


class LoginTests(TestCase):
    def setUp(self):
        self.user = make_admin(email="admin@civicconnect.gov.in", password="DemoAdmin@2026")

    def test_login_returns_token_and_user(self):
        response = api_client().post(
            LOGIN_URL, {"email": "admin@civicconnect.gov.in", "password": "DemoAdmin@2026"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        self.assertEqual(set(response.data["user"]), {"id", "email", "name", "role"})
        self.assertEqual(response.data["user"]["email"], "admin@civicconnect.gov.in")

    def test_login_email_is_case_insensitive(self):
        response = api_client().post(
            LOGIN_URL, {"email": "ADMIN@CivicConnect.Gov.In", "password": "DemoAdmin@2026"}, format="json"
        )
        self.assertEqual(response.status_code, 200)

    def test_login_with_wrong_password_is_401(self):
        response = api_client().post(
            LOGIN_URL, {"email": "admin@civicconnect.gov.in", "password": "nope"}, format="json"
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("detail", response.data)

    def test_login_missing_fields_is_401(self):
        response = api_client().post(LOGIN_URL, {"email": ""}, format="json")
        self.assertEqual(response.status_code, 401)


class SessionTests(TestCase):
    def setUp(self):
        self.user = make_admin()
        self.client = api_client(self.user)

    def test_me_requires_authentication(self):
        self.assertEqual(api_client().get(ME_URL).status_code, 401)

    def test_me_returns_current_user(self):
        response = self.client.get(ME_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.user.email)

    def test_logout_deletes_token(self):
        response = self.client.post(LOGOUT_URL)
        self.assertEqual(response.status_code, 204)
        # The same token is now rejected.
        self.assertEqual(self.client.get(ME_URL).status_code, 401)

    def test_admin_endpoint_returns_401_when_anonymous(self):
        self.assertEqual(api_client().get(FEEDBACK_URL).status_code, 401)

    def test_admin_endpoint_returns_403_for_non_staff(self):
        non_staff = make_admin(email="citizen@example.gov.in", password="pw12345678", is_staff=False)
        response = api_client(non_staff).get(FEEDBACK_URL)
        self.assertEqual(response.status_code, 403)
