"""API routes, mounted at ``/api/v1/`` by ``config.urls``."""

from django.urls import path

from feedback import views

urlpatterns = [
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", views.MeView.as_view(), name="auth-me"),
    path("feedback/", views.FeedbackListCreateView.as_view(), name="feedback-list-create"),
    path("feedback/<uuid:pk>/", views.FeedbackDetailView.as_view(), name="feedback-detail"),
    path(
        "attachments/<uuid:pk>/",
        views.AttachmentDownloadView.as_view(),
        name="attachment-download",
    ),
    path("departments/", views.DepartmentListCreateView.as_view(), name="department-list-create"),
    path(
        "departments/<uuid:pk>/",
        views.DepartmentDetailView.as_view(),
        name="department-detail",
    ),
    path("services/", views.ServiceListCreateView.as_view(), name="service-list-create"),
    path("services/<uuid:pk>/", views.ServiceDetailView.as_view(), name="service-detail"),
    path("locations/", views.LocationListView.as_view(), name="location-list"),
    path("analytics/summary/", views.AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path(
        "analytics/geographic/",
        views.GeographicAnalyticsView.as_view(),
        name="analytics-geographic",
    ),
    path("analytics/insights/", views.InsightsView.as_view(), name="analytics-insights"),
    path(
        "analytics/public-summary/",
        views.PublicSummaryView.as_view(),
        name="analytics-public-summary",
    ),
    path("reports/export/", views.ReportExportView.as_view(), name="report-export"),
]
