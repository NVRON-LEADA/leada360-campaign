from django.contrib import admin
from .models import Campaign, CampaignDispatch

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'status', 'total_recipients', 'sent_count', 'open_count', 'created_at')
    search_fields = ('title', 'subject', 'sender_email')
    list_filter = ('status', 'campaign_type', 'created_at')

@admin.register(CampaignDispatch)
class CampaignDispatchAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'contact', 'status', 'ses_message_id', 'sent_at')
    search_fields = ('ses_message_id', 'contact__email')
    list_filter = ('status', 'sent_at')

