from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/contacts/', include('apps.contacts.urls')),
    path('api/v1/campaigns/', include('apps.campaigns.urls')),
    path('api/v1/telemetry/', include('apps.telemetry.urls')),
    path('api/v1/users/', include('apps.users.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


