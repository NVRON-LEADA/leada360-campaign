from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/contacts/', include('apps.contacts.urls')),
    path('api/v1/campaigns/', include('apps.campaigns.urls')),
    path('api/v1/telemetry/', include('apps.telemetry.urls')),
    path('api/v1/users/', include('apps.users.urls')),
]

