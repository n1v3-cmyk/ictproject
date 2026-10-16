"""Departments and services: public reads, admin mutations, and deletion guards."""

from django.test import TestCase

from feedback.models import Department, Service
from feedback.tests.factories import (
    api_client,
    make_admin,
    make_department,
    make_feedback,
    make_location,
    make_service,
)

DEPARTMENTS_URL = "/api/v1/departments/"
SERVICES_URL = "/api/v1/services/"


class DepartmentReadTests(TestCase):
    def setUp(self):
        self.active = make_department(code="REV", name="Revenue")
        self.inactive = make_department(code="OLD", name="Defunct", is_active=False)
        make_service(self.active, code="REV-01", name="Mutation")
        make_service(self.active, code="REV-99", name="Retired", is_active=False)

    def test_public_list_is_unpaginated_and_active_only(self):
        response = api_client().get(DEPARTMENTS_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"results"})
        codes = [item["code"] for item in response.data["results"]]
        self.assertEqual(codes, ["REV"])

    def test_nested_services_active_only(self):
        response = api_client().get(DEPARTMENTS_URL)
        service_codes = [s["code"] for s in response.data["results"][0]["services"]]
        self.assertEqual(service_codes, ["REV-01"])

    def test_anonymous_include_inactive_is_ignored(self):
        response = api_client().get(DEPARTMENTS_URL, {"include_inactive": "true"})
        codes = [item["code"] for item in response.data["results"]]
        self.assertEqual(codes, ["REV"])

    def test_admin_include_inactive_returns_all(self):
        client = api_client(make_admin())
        response = client.get(DEPARTMENTS_URL, {"include_inactive": "true"})
        codes = sorted(item["code"] for item in response.data["results"])
        self.assertEqual(codes, ["OLD", "REV"])
        services = {s["code"] for item in response.data["results"] for s in item["services"]}
        self.assertIn("REV-99", services)


class DepartmentMutationTests(TestCase):
    def setUp(self):
        self.client = api_client(make_admin())

    def test_anonymous_cannot_create(self):
        self.assertEqual(api_client().post(DEPARTMENTS_URL, {"name": "X", "code": "X"}, format="json").status_code, 401)

    def test_create_department(self):
        response = self.client.post(
            DEPARTMENTS_URL,
            {"name": "Health", "code": "HFW", "description": "Health services"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["code"], "HFW")
        self.assertEqual(response.data["services"], [])
        self.assertTrue(response.data["is_active"])

    def test_patch_department_toggle_active(self):
        department = make_department(code="REV")
        response = self.client.patch(
            f"{DEPARTMENTS_URL}{department.id}/", {"is_active": False}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_active"])
        department.refresh_from_db()
        self.assertFalse(department.is_active)

    def test_delete_department_conflicts_when_feedback_exists(self):
        department = make_department(code="REV")
        service = make_service(department, code="REV-01")
        make_feedback(department=department, service=service, location=make_location())
        response = self.client.delete(f"{DEPARTMENTS_URL}{department.id}/")
        self.assertEqual(response.status_code, 409)
        self.assertTrue(Department.objects.filter(pk=department.pk).exists())

    def test_delete_department_conflicts_when_services_exist(self):
        department = make_department(code="REV")
        make_service(department, code="REV-01")
        response = self.client.delete(f"{DEPARTMENTS_URL}{department.id}/")
        self.assertEqual(response.status_code, 409)

    def test_delete_empty_department(self):
        department = make_department(code="EMPTY")
        response = self.client.delete(f"{DEPARTMENTS_URL}{department.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Department.objects.filter(pk=department.pk).exists())


class ServiceTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.client = api_client(self.admin)
        self.department = make_department(code="MVD")

    def test_public_list_is_active_only_and_unpaginated(self):
        make_service(self.department, code="MVD-01")
        make_service(self.department, code="MVD-02", is_active=False)
        response = api_client().get(SERVICES_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"results"})
        self.assertEqual([s["code"] for s in response.data["results"]], ["MVD-01"])

    def test_filter_services_by_department(self):
        other = make_department(code="REV")
        make_service(self.department, code="MVD-01")
        make_service(other, code="REV-01")
        response = api_client().get(SERVICES_URL, {"department": str(other.id)})
        self.assertEqual([s["code"] for s in response.data["results"]], ["REV-01"])

    def test_create_service(self):
        response = self.client.post(
            SERVICES_URL,
            {"department": str(self.department.id), "name": "Licence", "code": "MVD-01"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["code"], "MVD-01")

    def test_patch_service(self):
        service = make_service(self.department, code="MVD-01")
        response = self.client.patch(f"{SERVICES_URL}{service.id}/", {"is_active": False}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_active"])

    def test_delete_service_conflicts_when_referenced(self):
        service = make_service(self.department, code="MVD-01")
        make_feedback(department=self.department, service=service, location=make_location())
        response = self.client.delete(f"{SERVICES_URL}{service.id}/")
        self.assertEqual(response.status_code, 409)

    def test_delete_unused_service(self):
        service = make_service(self.department, code="MVD-09")
        response = self.client.delete(f"{SERVICES_URL}{service.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Service.objects.filter(pk=service.pk).exists())
