from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AtaItem, CheckIn, Customer, MaterialUsage, Project, ScopeItem
from .serializers import (
    AtaItemSerializer,
    CheckInSerializer,
    CustomerSerializer,
    MaterialUsageSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ScopeItemSerializer,
)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


def _to_decimal(value, default="0"):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(default)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a project from a customer name (created on the fly) plus
        optional initial scope (budget) lines."""
        data = request.data
        name = (data.get("name") or "").strip() or "Nytt projekt"
        customer_name = (data.get("customer_name") or "").strip() or "Ny kund"
        customer, _ = Customer.objects.get_or_create(name=customer_name)

        project = Project.objects.create(
            name=name,
            customer=customer,
            status=data.get("status") or Project.Status.PLANNING,
            contract_value=_to_decimal(data.get("contract_value")),
            margin_alert_threshold_pct=_to_decimal(
                data.get("margin_alert_threshold_pct"), "10"
            ),
        )

        for item in data.get("scope_items") or []:
            ScopeItem.objects.create(
                project=project,
                item_type=item.get("item_type") or ScopeItem.ItemType.LABOR,
                description=(item.get("description") or "").strip() or "Post",
                quantity=_to_decimal(item.get("quantity"), "1"),
                unit=item.get("unit") or "st",
                unit_cost=_to_decimal(item.get("unit_cost")),
            )

        return Response(
            ProjectDetailSerializer(project).data, status=status.HTTP_201_CREATED
        )


class ScopeItemViewSet(viewsets.ModelViewSet):
    queryset = ScopeItem.objects.all()
    serializer_class = ScopeItemSerializer


def _maybe_create_ata(project, title, estimated_cost):
    """Auto-create a 'detected' ÄTA for out-of-scope work."""
    AtaItem.objects.create(
        project=project,
        title=title,
        description="Automatiskt flaggat: arbete loggat utanför ursprunglig kontraktsomfattning.",
        estimated_cost=estimated_cost,
        status=AtaItem.Status.DETECTED,
        trigger_type=AtaItem.Trigger.AUTO,
        notify_deadline=(timezone.now() + timedelta(days=7)).date(),
    )


class CheckInViewSet(viewsets.ModelViewSet):
    queryset = CheckIn.objects.all().order_by("-logged_at")
    serializer_class = CheckInSerializer

    def create(self, request, *args, **kwargs):
        outside_scope = str(request.data.get("outside_scope", "")).lower() in (
            "true", "1", "yes", "on",
        )
        response = super().create(request, *args, **kwargs)
        if outside_scope and response.data.get("id"):
            check_in = CheckIn.objects.get(pk=response.data["id"])
            _maybe_create_ata(
                check_in.project,
                f"Extra arbete: {check_in.note or check_in.worker_name}",
                check_in.cost,
            )
        return response


class MaterialUsageViewSet(viewsets.ModelViewSet):
    queryset = MaterialUsage.objects.all().order_by("-logged_at")
    serializer_class = MaterialUsageSerializer

    def create(self, request, *args, **kwargs):
        outside_scope = str(request.data.get("outside_scope", "")).lower() in (
            "true", "1", "yes", "on",
        )
        response = super().create(request, *args, **kwargs)
        if outside_scope and response.data.get("id"):
            usage = MaterialUsage.objects.get(pk=response.data["id"])
            _maybe_create_ata(
                usage.project,
                f"Extra material: {usage.description}",
                usage.cost,
            )
        return response


class AtaItemViewSet(viewsets.ModelViewSet):
    queryset = AtaItem.objects.all().order_by("-created_at")
    serializer_class = AtaItemSerializer

    @action(detail=True, methods=["post"])
    def advance(self, request, pk=None):
        """Move an ÄTA forward through its approval flow (prototype helper)."""
        ata = self.get_object()
        flow = [
            AtaItem.Status.DETECTED,
            AtaItem.Status.PENDING_REVIEW,
            AtaItem.Status.APPROVED_INTERNAL,
            AtaItem.Status.SENT_TO_CUSTOMER,
            AtaItem.Status.CUSTOMER_APPROVED,
        ]
        if ata.status in flow:
            idx = flow.index(ata.status)
            if idx < len(flow) - 1:
                ata.status = flow[idx + 1]
                ata.save()
                # When the customer approves, ÄTA becomes a billable scope line.
                if ata.status == AtaItem.Status.CUSTOMER_APPROVED:
                    ScopeItem.objects.create(
                        project=ata.project,
                        item_type=ScopeItem.ItemType.LABOR,
                        description=f"ÄTA: {ata.title}",
                        quantity=1,
                        unit="st",
                        unit_cost=ata.estimated_cost,
                        is_ata=True,
                        ata_approved=True,
                    )
        return Response(AtaItemSerializer(ata).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        ata = self.get_object()
        ata.status = AtaItem.Status.REJECTED
        ata.save()
        return Response(AtaItemSerializer(ata).data)
