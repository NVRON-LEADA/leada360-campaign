from django.db import models
from apps.campaigns.models import Campaign
from apps.contacts.models import Contact

class EventType(models.TextChoices):
    OPEN = 'OPEN', 'Email Opened'
    CLICK = 'CLICK', 'Link Clicked'
    DELIVERED = 'DELIVERED', 'Delivered to Mailbox'
    BOUNCE = 'BOUNCE', 'Hard/Soft Bounce'
    COMPLAINT = 'COMPLAINT', 'Spam Complaint'
    UNSUBSCRIBE = 'UNSUBSCRIBE', 'Unsubscribed'

class EmailEvent(models.Model):
    """
    Append-only telemetry log.
    High-write volume table designed for partitioning in high-scale PostgreSQL.
    """
    id = models.BigAutoField(primary_key=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='events', db_index=True)
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='events', db_index=True)
    event_type = models.CharField(max_length=20, choices=EventType.choices, db_index=True)
    url_clicked = models.TextField(blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    raw_payload = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'email_events'
        ordering = ['-occurred_at']
        indexes = [
            models.Index(fields=['campaign', 'event_type', 'occurred_at']),
        ]

    def __str__(self):
        return f"{self.event_type} - Campaign {self.campaign_id} at {self.occurred_at}"


class Notification(models.Model):
    """
    Persistent in-database notification table.
    Tracks sent emails, failed/not-sent emails, bounces, opens, and read/done status.
    """
    TYPE_CHOICES = [
        ('SENT', 'Email Sent'),
        ('FAILED', 'Email Not Sent / Failed'),
        ('OPENED', 'Email Opened'),
        ('CLICKED', 'Link Clicked'),
        ('BOUNCED', 'Bounced'),
    ]

    id = models.BigAutoField(primary_key=True)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SENT', db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    recipient_email = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} - Read: {self.is_read}"
