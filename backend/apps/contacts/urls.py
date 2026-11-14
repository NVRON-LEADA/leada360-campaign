from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactViewSet, ContactListViewSet, SuppressionListViewSet

router = DefaultRouter()
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'lists', ContactListViewSet, basename='list')
router.register(r'suppression', SuppressionListViewSet, basename='suppression')

urlpatterns = [
    path('', include(router.urls)),
]

