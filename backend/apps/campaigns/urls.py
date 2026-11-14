from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, CampaignDispatchViewSet

router = DefaultRouter()
router.register(r'', CampaignViewSet, basename='campaign')
router.register(r'dispatches', CampaignDispatchViewSet, basename='dispatch')

urlpatterns = [
    path('', include(router.urls)),
]

