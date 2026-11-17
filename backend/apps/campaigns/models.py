import uuid
from django.db import models
from apps.contacts.models import Contact, ContactList

class CampaignStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    PROCESSING = 'PROCESSING', 'Processing'
    COMPLETED = 'COMPLETED', 'Completed'
    PAUSED = 'PAUSED', 'Paused'
    CANCELLED = 'CANCELLED', 'Cancelled'

class CampaignType(models.TextChoices):
    REGULAR = 'REGULAR', 'Regular Blast'
    AUTOMATED = 'AUTOMATED', 'Automated Journey'
    AB_TEST = 'AB_TEST', 'A/B Test'

class Campaign(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, help_text="Internal campaign reference name")
    subject = models.CharField(max_length=255)
    preheader = models.CharField(max_length=255, blank=True, default='')
    sender_name = models.CharField(max_length=150)
    sender_email = models.EmailField()
    reply_to = models.EmailField(blank=True, default='')
    
    campaign_type = models.CharField(max_length=20, choices=CampaignType.choices, default=CampaignType.REGULAR)
    status = models.CharField(max_length=20, choices=CampaignStatus.choices, default=CampaignStatus.DRAFT, db_index=True)

    # Content templates
    mjml_content = models.TextField(blank=True, default='', help_text="Raw MJML markup from drag-and-drop builder")
    compiled_html = models.TextField(blank=True, default='', help_text="Compiled responsive HTML ready for dispatch")
    attachment = models.FileField(upload_to='attachments/', null=True, blank=True, help_text="PDF or document attachment")
    attachment_name = models.CharField(max_length=255, blank=True, default='', help_text="Original uploaded attachment filename")

    # Target Audience
    target_lists = models.ManyToManyField(ContactList, related_name='campaigns', blank=True)

    # Scheduling & Delivery Timing
    scheduled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Aggregated Counters (Updated asynchronously by celery workers / webhooks)
    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    delivered_count = models.PositiveIntegerField(default=0)
    open_count = models.PositiveIntegerField(default=0)
    click_count = models.PositiveIntegerField(default=0)
    bounce_count = models.PositiveIntegerField(default=0)
    complaint_count = models.PositiveIntegerField(default=0)
    unsubscribe_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaigns'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.status}]"


class DispatchStatus(models.TextChoices):
    QUEUED = 'QUEUED', 'Queued'
    SENT = 'SENT', 'Sent to SES'
    FAILED = 'FAILED', 'Failed'
    DELIVERED = 'DELIVERED', 'Delivered'
    BOUNCED = 'BOUNCED', 'Bounced'

class CampaignDispatch(models.Model):
    """
    Individual email execution trace. 
    Guarantees idempotency (no double-sends) and maps SES Message-ID to contact.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='dispatches')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='dispatches')
    ses_message_id = models.CharField(max_length=200, blank=True, null=True, db_index=True)
    status = models.CharField(max_length=20, choices=DispatchStatus.choices, default=DispatchStatus.QUEUED, db_index=True)
    error_message = models.TextField(blank=True, default='')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'campaign_dispatches'
        unique_together = ('campaign', 'contact')
        indexes = [
            models.Index(fields=['campaign', 'status']),
            models.Index(fields=['ses_message_id']),
        ]

    def __str__(self):
        return f"Campaign {self.campaign_id} -> {self.contact.email} ({self.status})"


class EmailTemplate(models.Model):
    """
    Persistent customizable email templates.
    Supports title, category, description, theme palette, and default layout sections.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Template title")
    category = models.CharField(max_length=100, default='Custom', db_index=True)
    thumbnail = models.CharField(max_length=50, default='📧', help_text="Emoji or icon indicator")
    description = models.TextField(blank=True, default='')
    preview_color = models.CharField(max_length=50, default='#1e3a8a')
    
    # Theme configuration (headerBg, buttonBg, footerBg, etc.)
    theme = models.JSONField(default=dict, blank=True)
    
    # Default structured content (headingText, subheadingText, paragraphs, ctaButton, footerLinks, etc.)
    default_content = models.JSONField(default=dict, blank=True)
    
    # System default vs user custom created
    is_system = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaign_email_templates'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.name} ({self.category})"

