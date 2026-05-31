"""Seed the prototype with realistic Swedish construction project data.

Usage:  python manage.py seed
"""
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import (
    AtaItem,
    CheckIn,
    Customer,
    MaterialUsage,
    Project,
    ScopeItem,
)


class Command(BaseCommand):
    help = "Seed the database with demo data."

    def handle(self, *args, **options):
        # Start clean so re-running is safe.
        AtaItem.objects.all().delete()
        MaterialUsage.objects.all().delete()
        CheckIn.objects.all().delete()
        ScopeItem.objects.all().delete()
        Project.objects.all().delete()
        Customer.objects.all().delete()

        andersson = Customer.objects.create(
            name="Familjen Andersson", contact_email="andersson@example.se"
        )
        brf = Customer.objects.create(
            name="BRF Solgläntan", contact_email="styrelsen@solglantan.se"
        )

        # --- Project 1: healthy margin ---------------------------------------
        kitchen = Project.objects.create(
            name="Köksrenovering Villagatan 12",
            customer=andersson,
            status=Project.Status.ACTIVE,
            contract_value=Decimal("185000"),
        )
        ScopeItem.objects.create(
            project=kitchen, item_type=ScopeItem.ItemType.LABOR,
            description="Snickeri och montering", quantity=120, unit="h",
            unit_cost=Decimal("550"),
        )
        ScopeItem.objects.create(
            project=kitchen, item_type=ScopeItem.ItemType.MATERIAL,
            description="Köksluckor och bänkskiva", quantity=1, unit="set",
            unit_cost=Decimal("64000"),
        )
        CheckIn.objects.create(
            project=kitchen, worker_name="Erik Lund", hours=Decimal("64"),
            hourly_rate=Decimal("550"), note="Rivning och stomme",
        )
        MaterialUsage.objects.create(
            project=kitchen, description="Köksluckor (delleverans)",
            quantity=1, unit="set", unit_cost=Decimal("38000"),
        )

        # --- Project 2: at-risk margin + detected ÄTA ------------------------
        bathroom = Project.objects.create(
            name="Badrum BRF Solgläntan 3B",
            customer=brf,
            status=Project.Status.ACTIVE,
            contract_value=Decimal("142000"),
        )
        ScopeItem.objects.create(
            project=bathroom, item_type=ScopeItem.ItemType.LABOR,
            description="Tätskikt och plattsättning", quantity=90, unit="h",
            unit_cost=Decimal("600"),
        )
        ScopeItem.objects.create(
            project=bathroom, item_type=ScopeItem.ItemType.MATERIAL,
            description="Kakel, klinker, tätskikt", quantity=1, unit="set",
            unit_cost=Decimal("41000"),
        )
        CheckIn.objects.create(
            project=bathroom, worker_name="Sara Nyström", hours=Decimal("96"),
            hourly_rate=Decimal("600"), note="Plattsättning, mer tid än planerat",
        )
        CheckIn.objects.create(
            project=bathroom, worker_name="Sara Nyström", hours=Decimal("44"),
            hourly_rate=Decimal("600"), note="Extra rivning efter upptäckt fuktskada",
        )
        MaterialUsage.objects.create(
            project=bathroom, description="Kakel och tätskikt",
            quantity=1, unit="set", unit_cost=Decimal("44500"),
        )
        MaterialUsage.objects.create(
            project=bathroom, description="Extra material – fuktsanering",
            quantity=1, unit="set", unit_cost=Decimal("7500"),
        )
        AtaItem.objects.create(
            project=bathroom,
            title="Vattenskada bakom befintlig vägg",
            description="Upptäckt fukt och rötskada som inte ingick i ursprunglig omfattning.",
            estimated_cost=Decimal("18500"),
            status=AtaItem.Status.DETECTED,
            trigger_type=AtaItem.Trigger.AUTO,
            notify_deadline=(timezone.now() + timedelta(days=5)).date(),
        )

        self.stdout.write(self.style.SUCCESS("Seeded demo data."))
