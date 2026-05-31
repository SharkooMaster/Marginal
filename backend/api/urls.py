from rest_framework.routers import DefaultRouter

from .views import (
    AtaItemViewSet,
    CheckInViewSet,
    CustomerViewSet,
    MaterialUsageViewSet,
    ProjectViewSet,
    ScopeItemViewSet,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet)
router.register(r"customers", CustomerViewSet)
router.register(r"scope-items", ScopeItemViewSet)
router.register(r"check-ins", CheckInViewSet)
router.register(r"material-usages", MaterialUsageViewSet)
router.register(r"ata-items", AtaItemViewSet)

urlpatterns = router.urls
