from rest_framework import serializers
from .models import Campaign, CampaignDispatch
from apps.contacts.serializers import ContactListSerializer

class CampaignSerializer(serializers.ModelSerializer):
    target_list_details = ContactListSerializer(source='target_lists', many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = [
            'id', 'title', 'subject', 'preheader', 'sender_name', 'sender_email', 'reply_to',
            'campaign_type', 'status', 'mjml_content', 'compiled_html', 'target_lists',
            'target_list_details', 'scheduled_at', 'started_at', 'completed_at',
            'total_recipients', 'sent_count', 'delivered_count', 'open_count',
            'click_count', 'bounce_count', 'complaint_count', 'unsubscribe_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'started_at', 'completed_at', 'total_recipients', 'sent_count',
            'delivered_count', 'open_count', 'click_count', 'bounce_count',
            'complaint_count', 'unsubscribe_count', 'created_at', 'updated_at'
        ]

class CampaignDispatchSerializer(serializers.ModelSerializer):
    contact_email = serializers.EmailField(source='contact.email', read_only=True)

    class Meta:
        model = CampaignDispatch
        fields = ['id', 'campaign', 'contact', 'contact_email', 'ses_message_id', 'status', 'error_message', 'sent_at', 'delivered_at']
        read_only_fields = ['id', 'ses_message_id', 'sent_at', 'delivered_at']

