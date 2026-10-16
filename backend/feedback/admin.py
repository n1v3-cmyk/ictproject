"""Django admin registrations (an operator convenience; the API is the product)."""

from django.contrib import admin

from feedback.models import (
    AdminUser,
    Department,
    Feedback,
    FeedbackAttachment,
    Location,
    Service,
)


@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "role", "is_staff", "is_active")
    search_fields = ("email", "name")
    list_filter = ("is_staff", "is_active", "role")


class ServiceInline(admin.TabularInline):
    model = Service
    extra = 0
    fields = ("name", "code", "category", "average_resolution_days", "is_active")


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active", "contact_email")
    search_fields = ("name", "code")
    list_filter = ("is_active",)
    inlines = [ServiceInline]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "department", "category", "is_active")
    search_fields = ("name", "code")
    list_filter = ("is_active", "department")


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("district", "local_area", "state", "latitude", "longitude")
    search_fields = ("district", "local_area", "state")
    list_filter = ("state", "district")


class FeedbackAttachmentInline(admin.TabularInline):
    model = FeedbackAttachment
    extra = 0
    fields = ("file_name", "mime_type", "size_bytes")
    readonly_fields = ("file_name", "mime_type", "size_bytes")


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = (
        "reference_id",
        "created_at",
        "department",
        "service",
        "overall_rating",
        "sentiment",
        "is_anonymous",
    )
    search_fields = ("reference_id", "summary_comment")
    list_filter = ("sentiment", "department", "overall_rating", "is_anonymous")
    date_hierarchy = "created_at"
    inlines = [FeedbackAttachmentInline]
