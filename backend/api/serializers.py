from rest_framework import serializers

from .models import (
    AtaItem,
    CheckIn,
    Customer,
    MaterialUsage,
    Project,
    ReportPhoto,
    ScopeItem,
)


class ReportPhotoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = ReportPhoto
        fields = [
            "id", "project", "check_in", "material", "image",
            "caption", "uploaded_by_name", "can_delete", "created_at",
        ]

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return ""
        profile = getattr(obj.uploaded_by, "profile", None)
        return (profile.full_name if profile and profile.full_name else "") or (
            obj.uploaded_by.email or obj.uploaded_by.username
        )

    def get_can_delete(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        profile = getattr(user, "profile", None)
        is_manager = bool(profile and profile.role == "manager")
        return is_manager or obj.uploaded_by_id == user.id


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "name", "contact_email"]


class ScopeItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(
        max_digits=20, decimal_places=2, read_only=True
    )

    class Meta:
        model = ScopeItem
        fields = [
            "id", "project", "item_type", "description", "quantity",
            "unit", "unit_cost", "line_total", "is_ata", "ata_approved",
        ]


class CheckInSerializer(serializers.ModelSerializer):
    cost = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)

    class Meta:
        model = CheckIn
        fields = [
            "id", "project", "worker_name", "hours", "hourly_rate",
            "note", "cost", "logged_at",
        ]


class MaterialUsageSerializer(serializers.ModelSerializer):
    cost = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)

    class Meta:
        model = MaterialUsage
        fields = [
            "id", "project", "description", "quantity", "unit",
            "unit_cost", "cost", "logged_at",
        ]


class AtaItemSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AtaItem
        fields = [
            "id", "project", "title", "description", "estimated_cost",
            "status", "status_display", "trigger_type", "notify_deadline",
            "created_at",
        ]


class ProjectListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    current_margin = serializers.DecimalField(
        max_digits=20, decimal_places=2, read_only=True
    )
    current_margin_pct = serializers.DecimalField(
        max_digits=20, decimal_places=2, read_only=True
    )
    budgeted_total = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    actual_total = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    is_at_risk = serializers.BooleanField(read_only=True)
    open_ata_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "customer_name", "status", "status_display",
            "contract_value", "current_margin", "current_margin_pct",
            "budgeted_total", "actual_total",
            "is_at_risk", "open_ata_count", "archived",
        ]

    def get_open_ata_count(self, obj):
        return obj.ata_items.exclude(
            status__in=[AtaItem.Status.CUSTOMER_APPROVED, AtaItem.Status.REJECTED]
        ).count()


class ProjectDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    scope_items = ScopeItemSerializer(many=True, read_only=True)
    check_ins = CheckInSerializer(many=True, read_only=True)
    material_usages = MaterialUsageSerializer(many=True, read_only=True)
    ata_items = AtaItemSerializer(many=True, read_only=True)
    photos = ReportPhotoSerializer(many=True, read_only=True)

    budgeted_labor = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    budgeted_materials = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    budgeted_total = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    actual_labor = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    actual_materials = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    actual_total = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    approved_ata = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    current_margin = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    current_margin_pct = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    is_at_risk = serializers.BooleanField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "name", "customer_name", "status", "status_display",
            "contract_value", "margin_alert_threshold_pct", "archived",
            "budgeted_labor", "budgeted_materials", "budgeted_total",
            "actual_labor", "actual_materials", "actual_total",
            "approved_ata", "current_margin", "current_margin_pct", "is_at_risk",
            "scope_items", "check_ins", "material_usages", "ata_items", "photos",
        ]
