"""Core data model for the Marginal prototype.

Simplified from the full README data model, but keeps the spine:
Project -> ScopeItems (budget baseline) -> CheckIns / MaterialUsages (actuals)
-> AtaItems (out-of-scope work). Margin is derived from these.
"""
from decimal import Decimal

from django.conf import settings
from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    class Role(models.TextChoices):
        MANAGER = "manager", "Chef"
        WORKER = "worker", "Hantverkare"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="members", null=True, blank=True
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MANAGER)
    full_name = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Customer(models.Model):
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="customers", null=True, blank=True
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customers",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    class Status(models.TextChoices):
        REQUEST = "request", "Förfrågan"
        PLANNING = "planning", "Planering"
        ACTIVE = "active", "Pågående"
        COMPLETED = "completed", "Avslutad"
        INVOICED = "invoiced", "Fakturerad"

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="projects", null=True, blank=True
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=200)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="projects"
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    contract_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    margin_alert_threshold_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("10")
    )
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    # --- Derived margin helpers -------------------------------------------
    def _scope_total(self, item_type, is_ata):
        total = Decimal("0")
        for item in self.scope_items.all():
            if item.item_type == item_type and item.is_ata == is_ata:
                total += item.line_total
        return total

    @property
    def budgeted_labor(self):
        return self._scope_total(ScopeItem.ItemType.LABOR, is_ata=False)

    @property
    def budgeted_materials(self):
        return self._scope_total(ScopeItem.ItemType.MATERIAL, is_ata=False)

    @property
    def actual_labor(self):
        total = Decimal("0")
        for c in self.check_ins.all():
            total += c.cost
        return total

    @property
    def actual_materials(self):
        total = Decimal("0")
        for m in self.material_usages.all():
            total += m.cost
        return total

    @property
    def approved_ata(self):
        total = Decimal("0")
        for item in self.scope_items.all():
            if item.is_ata and item.ata_approved:
                total += item.line_total
        return total

    @property
    def actual_total(self):
        return self.actual_labor + self.actual_materials

    @property
    def budgeted_total(self):
        return self.budgeted_labor + self.budgeted_materials

    @property
    def current_margin(self):
        return (self.contract_value + self.approved_ata) - self.actual_total

    @property
    def current_margin_pct(self):
        revenue = self.contract_value + self.approved_ata
        if revenue <= 0:
            return Decimal("0")
        return (self.current_margin / revenue) * Decimal("100")

    @property
    def is_at_risk(self):
        return self.current_margin_pct < self.margin_alert_threshold_pct


class ScopeItem(models.Model):
    """Budget baseline line item. Approved ÄTA also lives here (is_ata=True)."""

    class ItemType(models.TextChoices):
        LABOR = "labor", "Arbete"
        MATERIAL = "material", "Material"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="scope_items"
    )
    item_type = models.CharField(max_length=20, choices=ItemType.choices)
    description = models.CharField(max_length=300)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1"))
    unit = models.CharField(max_length=20, default="st")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    is_ata = models.BooleanField(default=False)
    ata_approved = models.BooleanField(default=False)

    @property
    def line_total(self):
        return self.quantity * self.unit_cost

    def __str__(self):
        return f"{self.description} ({self.line_total})"


class CheckIn(models.Model):
    """Actual labor logged from the field."""

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="check_ins"
    )
    worker_name = models.CharField(max_length=200)
    hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    hourly_rate = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal("550")
    )
    note = models.CharField(max_length=300, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    @property
    def cost(self):
        return self.hours * self.hourly_rate

    def __str__(self):
        return f"{self.worker_name} – {self.hours}h"


class MaterialUsage(models.Model):
    """Actual materials logged from the field."""

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="material_usages"
    )
    description = models.CharField(max_length=300)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1"))
    unit = models.CharField(max_length=20, default="st")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    logged_at = models.DateTimeField(auto_now_add=True)

    @property
    def cost(self):
        return self.quantity * self.unit_cost

    def __str__(self):
        return f"{self.description} ({self.cost})"


class DeviceToken(models.Model):
    """An Expo push token for a user's device, used for push notifications."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens"
    )
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id}:{self.token[:16]}"


class ReportPhoto(models.Model):
    """A photo attached to a project (optionally to a specific check-in or
    material usage) by a worker reporting from the field."""

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="photos"
    )
    check_in = models.ForeignKey(
        CheckIn, on_delete=models.SET_NULL, related_name="photos", null=True, blank=True
    )
    material = models.ForeignKey(
        MaterialUsage, on_delete=models.SET_NULL, related_name="photos", null=True, blank=True
    )
    image = models.ImageField(upload_to="reports/%Y/%m/")
    caption = models.CharField(max_length=300, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto {self.id} – {self.project.name}"


class AtaItem(models.Model):
    """Potential additional/changed work (ÄTA)."""

    class Status(models.TextChoices):
        DETECTED = "detected", "Upptäckt"
        PENDING_REVIEW = "pending_review", "Väntar på granskning"
        APPROVED_INTERNAL = "approved_internal", "Godkänd internt"
        SENT_TO_CUSTOMER = "sent_to_customer", "Skickad till kund"
        CUSTOMER_APPROVED = "customer_approved", "Godkänd av kund"
        REJECTED = "rejected", "Avvisad"

    class Trigger(models.TextChoices):
        AUTO = "auto_no_matching_scope", "Automatiskt (utanför kontrakt)"
        MANUAL = "manual", "Manuellt"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="ata_items"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    estimated_cost = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0")
    )
    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.DETECTED
    )
    trigger_type = models.CharField(
        max_length=30, choices=Trigger.choices, default=Trigger.MANUAL
    )
    notify_deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
