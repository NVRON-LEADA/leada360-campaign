from django.contrib import admin
from .models import Contact, ContactList, ListContact, SuppressionList

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'status', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    list_filter = ('status', 'created_at')

@admin.register(ContactList)
class ContactListAdmin(admin.ModelAdmin):
    list_display = ('name', 'total_subscribers', 'created_at')
    search_fields = ('name',)

@admin.register(SuppressionList)
class SuppressionListAdmin(admin.ModelAdmin):
    list_display = ('email', 'reason', 'suppressed_at')
    search_fields = ('email',)
    list_filter = ('reason',)

