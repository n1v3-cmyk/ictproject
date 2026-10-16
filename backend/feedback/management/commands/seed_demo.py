"""Seed the catalogue, Kerala locations, an admin user, and (optionally) demo feedback.

Usage::

    python manage.py seed_demo                 # catalogue + locations + admin + 60 demo records
    python manage.py seed_demo --feedback 0    # catalogue + locations + admin only
    python manage.py seed_demo --reset         # wipe data first

The generated feedback is clearly synthetic demonstration data. It exists so the
admin dashboard, explorer, map, and reports have something to show; it is never
created implicitly by the API.
"""

from __future__ import annotations

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from feedback.models import AdminUser, Department, Feedback, Location, Service
from feedback.reference import generate_reference_id
from feedback.seed_data import DEPARTMENTS, KERALA_DISTRICTS, STATE
from feedback.sentiment import analyze_sentiment

DEFAULT_ADMIN_EMAIL = "admin@civicconnect.gov.in"
DEFAULT_ADMIN_PASSWORD = "DemoAdmin@2026"
DEFAULT_ADMIN_NAME = "District Nodal Officer"

POSITIVE_COMMENTS = [
    "The staff were very helpful and the process was fast and smooth.",
    "Excellent service, the officer was polite and everything was resolved quickly.",
    "Clear guidance and a seamless experience. Thank you for the timely support.",
    "Very efficient and professional handling of my request.",
    "Easy process, friendly staff, and a clean, well-maintained office.",
]

NEGATIVE_COMMENTS = [
    "Long waiting time and a confusing process with no clear guidance.",
    "The counter was crowded and the staff were rude and unhelpful.",
    "Repeated delays, the online portal was broken with constant errors.",
    "I was ignored for hours and eventually refused service without explanation.",
    "Terrible experience, the queue was slow and the officials were unresponsive.",
]

NEUTRAL_COMMENTS = [
    "The service was acceptable overall, though it took some time.",
    "Standard process with nothing particularly good or bad to report.",
    "Mixed experience; some steps were easy while others were unclear.",
]

CITIZEN_NAMES = [
    "Anand Krishnan",
    "Meera Nair",
    "Sneha Pillai",
    "Rajesh Menon",
    "Divya Thomas",
    "Arjun Varma",
]

TIMELY_DELIVERY = ["yes", "minor_delay", "significant_delay"]
PROCESS_CLARITY = ["very_clear", "acceptable", "confusing"]


class Command(BaseCommand):
    help = "Seed departments, services, Kerala locations, an admin user, and demo feedback."

    def add_arguments(self, parser):
        parser.add_argument(
            "--feedback",
            type=int,
            default=60,
            help="Number of synthetic demo feedback records to create (default: 60).",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing feedback, services, departments, and locations first.",
        )
        parser.add_argument("--admin-email", default=DEFAULT_ADMIN_EMAIL)
        parser.add_argument("--admin-name", default=DEFAULT_ADMIN_NAME)
        parser.add_argument("--admin-password", default=None)

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            Feedback.objects.all().delete()
            Service.objects.all().delete()
            Department.objects.all().delete()
            Location.objects.all().delete()
            self.stdout.write("Reset existing catalogue and feedback.")

        locations = self._seed_locations()
        departments = self._seed_catalogue()
        self._seed_admin(options)

        count = options["feedback"]
        if count > 0:
            self._seed_feedback(count, locations, departments)

        self.stdout.write(self.style.SUCCESS("Seed complete."))

    # ------------------------------------------------------------------ #

    def _seed_locations(self):
        locations = []
        for district in KERALA_DISTRICTS:
            latitude, longitude = district["coordinates"]
            for taluk in district["taluks"]:
                location, _ = Location.objects.update_or_create(
                    state=STATE,
                    district=district["name"],
                    local_area=taluk,
                    defaults={"latitude": latitude, "longitude": longitude},
                )
                locations.append(location)
        self.stdout.write(f"Seeded {len(locations)} locations.")
        return locations

    def _seed_catalogue(self):
        departments = []
        for spec in DEPARTMENTS:
            department, _ = Department.objects.update_or_create(
                code=spec["code"],
                defaults={
                    "name": spec["name"],
                    "description": spec["description"],
                    "icon_name": spec["icon_name"],
                    "contact_email": spec["contact_email"],
                    "nodal_officer": spec["nodal_officer"],
                    "is_active": True,
                },
            )
            for name, code, category, description in spec["services"]:
                Service.objects.update_or_create(
                    code=code,
                    defaults={
                        "department": department,
                        "name": name,
                        "description": description,
                        "category": category,
                        "is_active": True,
                    },
                )
            departments.append(department)
        self.stdout.write(f"Seeded {len(departments)} departments with services.")
        return departments

    def _seed_admin(self, options):
        email = options["admin_email"].strip().lower()
        password = options["admin_password"] or DEFAULT_ADMIN_PASSWORD
        user, created = AdminUser.objects.get_or_create(
            email=email,
            defaults={"name": options["admin_name"], "role": "admin", "is_staff": True},
        )
        user.name = options["admin_name"] or user.name
        user.is_staff = True
        user.is_active = True
        user.set_password(password)
        user.save()
        verb = "Created" if created else "Updated"
        self.stdout.write(f"{verb} admin user: {email}")

    def _seed_feedback(self, count, locations, departments):
        rng = random.Random(20261017)
        now = timezone.now()

        services_by_department = {
            department.id: list(Service.objects.filter(department=department)) for department in departments
        }

        created = 0
        for index in range(count):
            department = rng.choice(departments)
            services = services_by_department[department.id]
            if not services:
                continue
            service = rng.choice(services)
            location = rng.choice(locations)

            rating = rng.choices([1, 2, 3, 4, 5], weights=[3, 3, 2, 5, 6])[0]
            if rating >= 4:
                summary = rng.choice(POSITIVE_COMMENTS)
            elif rating <= 2:
                summary = rng.choice(NEGATIVE_COMMENTS)
            else:
                summary = rng.choice(NEUTRAL_COMMENTS)

            def near(value: int) -> int:
                return max(1, min(5, value + rng.choice([-1, 0, 0, 1])))

            categories = {
                "helpfulness": near(rating),
                "communication": near(rating),
                "professionalism": near(rating),
                "response_time": near(rating),
            }
            category_average = sum(categories.values()) / 4
            analysis = analyze_sentiment(f"{summary} ", rating, category_average)

            is_anonymous = rng.random() < 0.7
            citizen_name = "" if is_anonymous else rng.choice(CITIZEN_NAMES)

            feedback = Feedback.objects.create(
                reference_id=generate_reference_id(),
                location=location,
                department=department,
                service=service,
                overall_rating=rating,
                helpfulness=categories["helpfulness"],
                communication=categories["communication"],
                professionalism=categories["professionalism"],
                response_time=categories["response_time"],
                timely_delivery=rng.choice(TIMELY_DELIVERY),
                process_clarity=rng.choice(PROCESS_CLARITY),
                digital_access_used=rng.random() < 0.6,
                summary_comment=summary,
                detailed_description="",
                sentiment=analysis.sentiment,
                sentiment_score=analysis.score,
                sentiment_status=analysis.status,
                sentiment_method=analysis.method,
                keywords=list(analysis.detected_keywords),
                is_anonymous=is_anonymous,
                citizen_name=citizen_name,
            )

            # Spread records over the last ~120 days so trends and volume exist.
            created_at = now - timedelta(
                days=rng.randint(0, 120),
                hours=rng.randint(0, 23),
                minutes=rng.randint(0, 59),
            )
            Feedback.objects.filter(pk=feedback.pk).update(created_at=created_at)
            created += 1

        self.stdout.write(f"Seeded {created} synthetic feedback records.")
