"""Locations: public list, nullable coordinates, and server-side resolution."""

from django.test import TestCase

from feedback.models import Location
from feedback.tests.factories import make_location

LOCATIONS_URL = "/api/v1/locations/"


class LocationTests(TestCase):
    def test_public_unpaginated_list(self):
        make_location(district="Ernakulam", local_area="Kanayannur (Kochi)", latitude=9.97, longitude=76.28)
        make_location(district="Wayanad", local_area="Mananthavady", latitude=None, longitude=None)
        response = self.client.get(LOCATIONS_URL)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data), {"results"})
        self.assertEqual(len(response.data["results"]), 2)

    def test_null_coordinates_are_returned_as_null(self):
        make_location(district="Wayanad", local_area="Mananthavady", latitude=None, longitude=None)
        response = self.client.get(LOCATIONS_URL)
        item = response.data["results"][0]
        self.assertIsNone(item["latitude"])
        self.assertIsNone(item["longitude"])

    def test_location_shape_matches_contract(self):
        make_location()
        item = self.client.get(LOCATIONS_URL).data["results"][0]
        self.assertEqual(
            set(item), {"id", "state", "district", "local_area", "latitude", "longitude"}
        )

    def test_locations_are_not_duplicated_on_repeat_submission(self):
        from feedback.tests.factories import api_client, make_department, make_service, valid_payload

        department = make_department(code="REV")
        service = make_service(department, code="REV-01")
        payload = valid_payload(department, service)
        api_client().post("/api/v1/feedback/", payload, format="json")
        api_client().post("/api/v1/feedback/", payload, format="json")
        self.assertEqual(
            Location.objects.filter(district="Ernakulam", local_area="Kanayannur (Kochi)").count(), 1
        )
