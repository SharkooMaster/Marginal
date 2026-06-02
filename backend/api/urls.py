from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .auth_views import (
    DeviceTokenView,
    LoginView,
    MeView,
    RegisterView,
    TeamMemberView,
    TeamView,
)
from .views import (
    AtaItemViewSet,
    CheckInViewSet,
    CustomerViewSet,
    MaterialUsageViewSet,
    ProjectViewSet,
    ReportPhotoViewSet,
    ScopeItemViewSet,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"scope-items", ScopeItemViewSet, basename="scopeitem")
router.register(r"check-ins", CheckInViewSet, basename="checkin")
router.register(r"material-usages", MaterialUsageViewSet, basename="materialusage")
router.register(r"ata-items", AtaItemViewSet, basename="ataitem")
router.register(r"photos", ReportPhotoViewSet, basename="reportphoto")

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/token/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("auth/team/", TeamView.as_view()),
    path("auth/team/<int:user_id>/", TeamMemberView.as_view()),
    path("auth/device/", DeviceTokenView.as_view()),
] + router.urls
