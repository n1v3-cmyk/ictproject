"""Model constraints, defaults, and identity handling."""

from django.db import IntegrityError, transaction
from django.test import TestCase

from feedback.models import AdminUser, Department, Feedback, Location, Service
from feedback.tests.factories import (
    make_admin,
    make_department,
    make_feedback,
    make_location,
    make_service,
)


class AdminUserModelTests(TestCase):
    def test_create_user_is_not_staff(self):
        user = AdminUser.objects.create_user(email="Person@Example.Gov.In", password="pw12345678")
        self.assertFalse(user.is_staff)
        self.assertEqual(user.email, "person@example.gov.in")  # normalised

    def test_create_superuser_is_staff(self):
        user = AdminUser.objects.create_superuser(email="boss@example.gov.in", password="pw12345678")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_password_is_hashed(self):
        user = make_admin(password="DemoAdmin@2026")
        self.assertNotEqual(user.password, "DemoAdmin@2026")
        self.assertTrue(user.check_password("DemoAdmin@2026"))


class ConstraintTests(TestCase):
    def setUp(self):
        self.department = make_department()
        self.service = make_service(self.department)
        self.location = make_location()

    def test_department_code_is_unique(self):
        make_department(code="DUP")
        with self.assertRaises(IntegrityError), transaction.atomic():
            make_department(code="DUP")

    def test_service_code_is_unique(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Service.objects.create(department=self.department, name="Other", code=self.service.code)

    def test_location_triple_is_unique(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Location.objects.create(
                state=self.location.state,
                district=self.location.district,
                local_area=self.location.local_area,
                latitude=1.0,
                longitude=2.0,
            )

    def test_overall_rating_check_constraint(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            make_feedback(
                department=self.department,
                service=self.service,
                location=self.location,
                overall=6,
            )

    def test_sentiment_score_check_constraint(self):
        feedback = make_feedback(
            department=self.department, service=self.service, location=self.location
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            Feedback.objects.filter(pk=feedback.pk).update(sentiment_score=101)

    def test_reference_ids_are_unique(self):
        first = make_feedback(department=self.department, service=self.service, location=self.location)
        second = make_feedback(department=self.department, service=self.service, location=self.location)
        self.assertNotEqual(first.reference_id, second.reference_id)
        self.assertRegex(first.reference_id, r"^CC-KL-\d{4}-\d+$")


class IdentityTests(TestCase):
    def setUp(self):
        self.department = make_department()
        self.service = make_service(self.department)
        self.location = make_location()

    def test_anonymous_record_never_exposes_identity(self):
        feedback = make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            is_anonymous=True,
            citizen_name="Should Not Leak",
            citizen_contact="9999999999",
        )
        # Identity may exist internally...
        self.assertEqual(feedback.citizen_name, "Should Not Leak")
        # ...but the public accessors hide it.
        self.assertIsNone(feedback.public_citizen_name())
        self.assertIsNone(feedback.public_citizen_contact())

    def test_identified_record_exposes_identity(self):
        feedback = make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            is_anonymous=False,
            citizen_name="Meera Nair",
        )
        self.assertEqual(feedback.public_citizen_name(), "Meera Nair")

    def test_category_average_and_ratings(self):
        feedback = make_feedback(
            department=self.department,
            service=self.service,
            location=self.location,
            overall=4,
            categories={"helpfulness": 1, "communication": 2, "professionalism": 3, "response_time": 4},
        )
        self.assertEqual(feedback.category_average, 2.5)
        self.assertEqual(
            feedback.category_ratings,
            {"helpfulness": 1, "communication": 2, "professionalism": 3, "response_time": 4},
        )
