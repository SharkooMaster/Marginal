from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .auth_views import get_profile
from .events import trigger_company_event
from .invoice import build_invoice_pdf
from .push import notify_managers
from .models import (
    AtaItem,
    CheckIn,
    Customer,
    MaterialUsage,
    Project,
    ReportPhoto,
    ScopeItem,
    UserProfile,
)
from .serializers import (
    AtaItemSerializer,
    CheckInSerializer,
    CustomerSerializer,
    MaterialUsageSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ReportPhotoSerializer,
    ScopeItemSerializer,
)


def _company(user):
    return get_profile(user).company


def _is_manager(user):
    return get_profile(user).role == UserProfile.Role.MANAGER


def _require_manager(user):
    if not _is_manager(user):
        raise PermissionDenied("Endast chefer kan göra detta.")


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        return Customer.objects.filter(company=_company(self.request.user))

    def perform_create(self, serializer):
        _require_manager(self.request.user)
        serializer.save(owner=self.request.user, company=_company(self.request.user))


def _to_decimal(value, default="0"):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(default)


class ProjectViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = Project.objects.filter(company=_company(self.request.user)).order_by(
            "-created_at"
        )
        # The dashboard lists active projects; the archive page passes
        # ?archived=true. Detail/update/delete operate on any company project.
        if self.action == "list":
            archived = str(self.request.query_params.get("archived", "")).lower() in (
                "true", "1", "yes",
            )
            qs = qs.filter(archived=archived)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailSerializer

    def create(self, request, *args, **kwargs):
        """Create a project from a customer name (created on the fly) plus
        optional initial scope (budget) lines."""
        _require_manager(request.user)
        company = _company(request.user)
        data = request.data
        name = (data.get("name") or "").strip() or "Nytt projekt"
        customer_name = (data.get("customer_name") or "").strip() or "Ny kund"
        customer, _ = Customer.objects.get_or_create(
            company=company, name=customer_name, defaults={"owner": request.user}
        )

        project = Project.objects.create(
            company=company,
            owner=request.user,
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

        trigger_company_event(
            company.id if company else None,
            "project.created",
            {"id": project.id, "name": project.name},
        )
        return Response(
            ProjectDetailSerializer(project).data, status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Edit a project's basics (name, customer, price, threshold)."""
        _require_manager(request.user)
        project = self.get_object()
        data = request.data

        if "name" in data:
            name = (data.get("name") or "").strip()
            if name:
                project.name = name
        if "customer_name" in data:
            customer_name = (data.get("customer_name") or "").strip()
            if customer_name:
                customer, _ = Customer.objects.get_or_create(
                    company=_company(request.user),
                    name=customer_name,
                    defaults={"owner": request.user},
                )
                project.customer = customer
        if "contract_value" in data:
            project.contract_value = _to_decimal(data.get("contract_value"))
        if "margin_alert_threshold_pct" in data:
            project.margin_alert_threshold_pct = _to_decimal(
                data.get("margin_alert_threshold_pct"), "10"
            )
        if data.get("status"):
            project.status = data.get("status")
        if "archived" in data:
            val = data.get("archived")
            project.archived = val is True or str(val).lower() in (
                "true", "1", "yes", "on",
            )

        project.save()
        trigger_company_event(
            project.company_id,
            "project.updated",
            {"id": project.id, "name": project.name, "is_at_risk": project.is_at_risk},
        )
        return Response(ProjectDetailSerializer(project).data)

    def destroy(self, request, *args, **kwargs):
        _require_manager(request.user)
        project = self.get_object()
        company_id = project.company_id
        name = project.name
        response = super().destroy(request, *args, **kwargs)
        trigger_company_event(company_id, "project.deleted", {"name": name})
        return response

    @action(detail=True, methods=["get"], url_path="invoice")
    def invoice(self, request, pk=None):
        """Return a PDF invoice basis (contract + approved ÄTA + moms)."""
        _require_manager(request.user)
        project = self.get_object()
        pdf = build_invoice_pdf(project)
        resp = HttpResponse(pdf, content_type="application/pdf")
        resp["Content-Disposition"] = (
            f'inline; filename="fakturaunderlag-{project.id}.pdf"'
        )
        return resp


def _require_company_project(user, project_id):
    project = Project.objects.filter(pk=project_id, company=_company(user)).first()
    if project is None:
        raise PermissionDenied("Projektet finns inte eller tillhör inte ditt företag.")
    return project


class ScopeItemViewSet(viewsets.ModelViewSet):
    serializer_class = ScopeItemSerializer

    def get_queryset(self):
        return ScopeItem.objects.filter(project__company=_company(self.request.user))

    def perform_create(self, serializer):
        _require_manager(self.request.user)
        _require_company_project(self.request.user, self.request.data.get("project"))
        serializer.save()

    def perform_update(self, serializer):
        _require_manager(self.request.user)
        serializer.save()

    def perform_destroy(self, instance):
        _require_manager(self.request.user)
        instance.delete()


def _fmt_amount(value):
    """Render a number without noisy trailing zeros for ÄTA detail text."""
    try:
        f = float(value)
    except (TypeError, ValueError):
        return str(value)
    if f == int(f):
        return str(int(f))
    return f"{f:.2f}".rstrip("0").rstrip(".")


def _maybe_create_ata(project, title, estimated_cost, description=None, check_in=None, material=None):
    """Auto-create a 'detected' ÄTA for out-of-scope work, linked to the field
    report that triggered it so a rejection can drop the cost from actuals."""
    AtaItem.objects.create(
        project=project,
        check_in=check_in,
        material=material,
        title=title,
        description=description
        or "Automatiskt flaggat: arbete loggat utanför ursprunglig kontraktsomfattning.",
        estimated_cost=estimated_cost,
        status=AtaItem.Status.DETECTED,
        trigger_type=AtaItem.Trigger.AUTO,
        notify_deadline=(timezone.now() + timedelta(days=7)).date(),
    )
    trigger_company_event(
        project.company_id,
        "ata.detected",
        {"project_id": project.id, "project": project.name, "title": title},
    )
    notify_managers(
        project.company_id,
        "Ny ÄTA upptäckt",
        f"{project.name}: {title}",
        {"project_id": project.id},
    )


def _report_logged(project, summary):
    """Notify the company a field report was logged, flagging margin risk."""
    trigger_company_event(
        project.company_id,
        "report.logged",
        {
            "project_id": project.id,
            "project": project.name,
            "summary": summary,
            "is_at_risk": project.is_at_risk,
        },
    )
    if project.is_at_risk:
        notify_managers(
            project.company_id,
            "Marginal i fara",
            f"{project.name} ligger under marginalgränsen.",
            {"project_id": project.id},
        )


class CheckInViewSet(viewsets.ModelViewSet):
    serializer_class = CheckInSerializer

    def get_queryset(self):
        return CheckIn.objects.filter(project__company=_company(self.request.user)).order_by(
            "-logged_at"
        )

    def create(self, request, *args, **kwargs):
        _require_company_project(request.user, request.data.get("project"))
        outside_scope = str(request.data.get("outside_scope", "")).lower() in (
            "true", "1", "yes", "on",
        )
        response = super().create(request, *args, **kwargs)
        if response.data.get("id"):
            check_in = CheckIn.objects.get(pk=response.data["id"])
            if outside_scope:
                detail = (
                    "Typ: Arbete (utanför kontrakt)\n"
                    f"Utförare: {check_in.worker_name}\n"
                    f"Tid: {_fmt_amount(check_in.hours)} h × "
                    f"{_fmt_amount(check_in.hourly_rate)} kr/h"
                )
                if check_in.note:
                    detail += f"\nBeskrivning: {check_in.note}"
                work_label = (check_in.note or "").strip() or (
                    f"Arbete – {check_in.worker_name}"
                )
                _maybe_create_ata(
                    check_in.project,
                    work_label,
                    check_in.cost,
                    detail,
                    check_in=check_in,
                )
            _report_logged(
                check_in.project,
                f"{check_in.worker_name} loggade {check_in.hours}h",
            )
        return response


class MaterialUsageViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialUsageSerializer

    def get_queryset(self):
        return MaterialUsage.objects.filter(
            project__company=_company(self.request.user)
        ).order_by("-logged_at")

    def create(self, request, *args, **kwargs):
        _require_company_project(request.user, request.data.get("project"))
        outside_scope = str(request.data.get("outside_scope", "")).lower() in (
            "true", "1", "yes", "on",
        )
        response = super().create(request, *args, **kwargs)
        if response.data.get("id"):
            usage = MaterialUsage.objects.get(pk=response.data["id"])
            if outside_scope:
                detail = (
                    "Typ: Material (utanför kontrakt)\n"
                    f"Artikel: {usage.description}\n"
                    f"Mängd: {_fmt_amount(usage.quantity)} {usage.unit} × "
                    f"{_fmt_amount(usage.unit_cost)} kr/{usage.unit}"
                )
                _maybe_create_ata(
                    usage.project,
                    (usage.description or "Material").strip(),
                    usage.cost,
                    detail,
                    material=usage,
                )
            _report_logged(usage.project, f"Material: {usage.description}")
        return response


class AtaItemViewSet(viewsets.ModelViewSet):
    serializer_class = AtaItemSerializer

    def get_queryset(self):
        return AtaItem.objects.filter(project__company=_company(self.request.user)).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        """Managers can register an ÄTA by hand (e.g. work not auto-detected)."""
        _require_manager(self.request.user)
        project = _require_company_project(
            self.request.user, self.request.data.get("project")
        )
        ata = serializer.save(trigger_type=AtaItem.Trigger.MANUAL)
        trigger_company_event(
            project.company_id,
            "ata.updated",
            {"project_id": project.id, "status": ata.status},
        )

    def perform_update(self, serializer):
        _require_manager(self.request.user)
        ata = serializer.save()
        trigger_company_event(
            ata.project.company_id,
            "ata.updated",
            {"project_id": ata.project_id, "status": ata.status},
        )

    def perform_destroy(self, instance):
        _require_manager(self.request.user)
        project_id = instance.project_id
        company_id = instance.project.company_id
        instance.delete()
        trigger_company_event(
            company_id, "ata.updated", {"project_id": project_id}
        )

    @action(detail=True, methods=["post"])
    def advance(self, request, pk=None):
        """Move an ÄTA forward through its approval flow (prototype helper)."""
        _require_manager(request.user)
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
                trigger_company_event(
                    ata.project.company_id,
                    "ata.updated",
                    {"project_id": ata.project_id, "status": ata.status},
                )
        return Response(AtaItemSerializer(ata).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        _require_manager(request.user)
        ata = self.get_object()
        ata.status = AtaItem.Status.REJECTED
        ata.save()
        trigger_company_event(
            ata.project.company_id,
            "ata.updated",
            {"project_id": ata.project_id, "status": ata.status},
        )
        return Response(AtaItemSerializer(ata).data)


class ReportPhotoViewSet(viewsets.ModelViewSet):
    """Field photos. Workers and managers can upload to company projects."""

    serializer_class = ReportPhotoSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = ReportPhoto.objects.filter(
            project__company=_company(self.request.user)
        ).order_by("-created_at")
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def create(self, request, *args, **kwargs):
        project = _require_company_project(request.user, request.data.get("project"))
        if not request.data.get("image"):
            return Response({"detail": "Ingen bild bifogad."}, status=400)
        photo = ReportPhoto.objects.create(
            project=project,
            check_in_id=request.data.get("check_in") or None,
            material_id=request.data.get("material") or None,
            image=request.data["image"],
            caption=(request.data.get("caption") or "")[:300],
            uploaded_by=request.user,
        )
        trigger_company_event(
            project.company_id,
            "photo.added",
            {"project_id": project.id, "project": project.name},
        )
        return Response(
            ReportPhotoSerializer(photo, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        photo = self.get_object()
        # Managers can remove any photo; everyone else only their own uploads.
        if not _is_manager(request.user) and photo.uploaded_by_id != request.user.id:
            return Response(
                {"detail": "Du kan bara ta bort dina egna foton."}, status=403
            )
        project = photo.project
        photo.image.delete(save=False)  # remove the file from disk too
        photo.delete()
        trigger_company_event(
            project.company_id,
            "photo.deleted",
            {"project_id": project.id, "project": project.name},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
