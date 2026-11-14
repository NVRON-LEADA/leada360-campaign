import uuid
from django.db import models
from django.utils import timezone

class ContactStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    UNSUBSCRIBED = 'UNSUBSCRIBED', 'Unsubscribed'
    BOUNCED = 'BOUNCED', 'Bounced'
    COMPLAINED = 'COMPLAINED', 'Complained'

class Contact(models.Model):
    """
    Subscribers / Lead entities. Designed for indexing high-throughput email dispatches.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    company = models.CharField(max_length=200, blank=True, default='')
    attributes = models.JSONField(default=dict, blank=True, help_text="Dynamic custom fields (e.g., job_title, tags, country)")
    status = models.CharField(
        max_length=20,
        choices=ContactStatus.choices,
        default=ContactStatus.ACTIVE,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contacts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.email} ({self.status})"


class ContactList(models.Model):
    """
    Named subscriber lists (e.g. 'Newsletter Leads', 'Webinar Registrants').
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, default='')
    total_subscribers = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contact_lists'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ListContact(models.Model):
    """
    Many-to-Many through-table for fast filtering, joins, and subscription timestamps.
    """
    id = models.BigAutoField(primary_key=True)
    list = models.ForeignKey(ContactList, on_delete=models.CASCADE, related_name='memberships')
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='list_memberships')
    subscribed_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = 'list_contacts'
        unique_together = ('list', 'contact')
        indexes = [
            models.Index(fields=['list', 'contact']),
        ]

    def __str__(self):
        return f"{self.contact.email} in {self.list.name}"


class SuppressionReason(models.TextChoices):
    HARD_BOUNCE = 'HARD_BOUNCE', 'Hard Bounce'
    COMPLAINT = 'COMPLAINT', 'Spam Complaint'
    UNSUBSCRIBE = 'UNSUBSCRIBE', 'Manual Unsubscribe'
    ADMIN_SUPPRESSION = 'ADMIN_SUPPRESSION', 'Admin Suppressed'

class SuppressionList(models.Model):
    """
    Global suppression list. Critical for SES compliance.
    Any email here is excluded from EVERY outbound campaign chunk.
    """
    email = models.EmailField(primary_key=True, max_length=254)
    reason = models.CharField(max_length=30, choices=SuppressionReason.choices, default=SuppressionReason.HARD_BOUNCE)
    source_campaign_id = models.CharField(max_length=100, blank=True, null=True)
    suppressed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'suppression_list'
        indexes = [
            models.Index(fields=['email', 'reason']),
        ]

    def __str__(self):
        return f"{self.email} [{self.reason}]"

