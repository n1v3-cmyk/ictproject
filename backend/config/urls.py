"""URL configuration for the CivicConnect backend.

The API lives under ``/api/v1/`` exactly as documented in ``docs/api-contract.md``.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/v1/", include("feedback.urls")),
]

if settings.DEBUG:
    # Serve uploaded attachments during development only. In production a real
    # web server / object storage handles MEDIA_URL.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
