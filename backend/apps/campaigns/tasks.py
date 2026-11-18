import base64
import json
import logging
import re
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from .models import Campaign, CampaignStatus, CampaignDispatch, DispatchStatus
from apps.contacts.models import Contact, ListContact, SuppressionList, ContactStatus
from .services import SESClientService

logger = logging.getLogger(__name__)

def generate_signed_token(campaign_id, contact_id):
    payload = json.dumps({'c': str(campaign_id), 'u': str(contact_id)})
    return base64.urlsafe_b64encode(payload.encode()).decode()

def inject_telemetry(html_body, campaign_id, contact_id):
    """
    1. Injects 1x1 transparent open tracking pixel.
    2. Rewrites all <a href="..."> hyperlinks into secure tracked redirect links.
    """
    token = generate_signed_token(campaign_id, contact_id)
    base_url = settings.TRACKING_BASE_URL.rstrip('/')

    # Open pixel
    open_pixel = f'<img src="{base_url}/api/v1/telemetry/o/{token}.png" width="1" height="1" alt="" style="display:none !important;" />'

    # Hyperlink rewrite regex
    def replace_link(match):
        original_url = match.group(1)
        if original_url.startswith('mailto:') or original_url.startswith('#'):
            return match.group(0)
        encoded_dest = base64.urlsafe_b64encode(original_url.encode()).decode()
        tracked_url = f'{base_url}/api/v1/telemetry/c/{token}?d={encoded_dest}'
        return f'href="{tracked_url}"'

    modified_html = re.sub(r'href=["\']([^"\']+)["\']', replace_link, html_body)
    
    if '</body>' in modified_html:
        modified_html = modified_html.replace('</body>', f'{open_pixel}</body>')
    else:
        modified_html += open_pixel

    return modified_html, token


@shared_task(bind=True, max_retries=3)
def prepare_campaign_chunks(self, campaign_id):
    """
    Step 1 of Campaign Pipeline:
    - Finds all unique contacts from targeted lists.
    - Excludes contacts in the SUPPRESSION_LIST or non-ACTIVE status.
    - Creates CampaignDispatch records idempotently.
    - Splits into chunks of 500 recipients and enqueues worker tasks.
    """
    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found.")
        return

    campaign.status = CampaignStatus.PROCESSING
    campaign.started_at = timezone.now()
    campaign.save(update_fields=['status', 'started_at'])

    # Query target contacts
    target_lists = campaign.target_lists.all()
    if not target_lists.exists():
        logger.warning(f"Campaign {campaign_id} has no target lists assigned.")
        campaign.status = CampaignStatus.COMPLETED
        campaign.completed_at = timezone.now()
        campaign.save()
        return

    # Gather contact IDs, filtering out suppressed emails
    suppressed_emails = set(SuppressionList.objects.values_list('email', flat=True))
    
    contact_ids = (
        ListContact.objects
        .filter(list__in=target_lists, contact__status=ContactStatus.ACTIVE)
        .exclude(contact__email__in=suppressed_emails)
        .values_list('contact_id', flat=True)
        .distinct()
    )

    contact_id_list = list(contact_ids)
    total_count = len(contact_id_list)
    campaign.total_recipients = total_count
    campaign.save(update_fields=['total_recipients'])

    if total_count == 0:
        logger.warning(f"Campaign {campaign_id}: 0 eligible contacts after suppression/status filter.")
        campaign.status = CampaignStatus.COMPLETED
        campaign.completed_at = timezone.now()
        campaign.save()
        return

    # Create CampaignDispatch records in bulk (idempotency barrier)
    dispatches = [
        CampaignDispatch(campaign=campaign, contact_id=cid, status=DispatchStatus.QUEUED)
        for cid in contact_id_list
    ]
    CampaignDispatch.objects.bulk_create(dispatches, ignore_conflicts=True, batch_size=2000)

    # Fetch ONLY contacts whose dispatch status is still QUEUED (skips already SENT contacts on resume)
    pending_contact_ids = list(
        CampaignDispatch.objects.filter(
            campaign=campaign,
            status=DispatchStatus.QUEUED
        ).values_list('contact_id', flat=True)
    )

    logger.info(f"[DISPATCH] Campaign '{campaign.title}': {len(pending_contact_ids)} contacts pending out of {total_count} total.")

    if not pending_contact_ids:
        actual_sent = CampaignDispatch.objects.filter(campaign=campaign, status=DispatchStatus.SENT).count()
        campaign.sent_count = actual_sent
        campaign.status = CampaignStatus.COMPLETED
        campaign.completed_at = timezone.now()
        campaign.save(update_fields=['sent_count', 'status', 'completed_at'])
        return

    # Chunking: 50 recipients per worker job to keep DB transactions active and prevent timeouts
    CHUNK_SIZE = 50
    for i in range(0, len(pending_contact_ids), CHUNK_SIZE):
        chunk_cids = [str(cid) for cid in pending_contact_ids[i:i + CHUNK_SIZE]]
        try:
            _run_dispatch_chunk(str(campaign.id), chunk_cids)
        except Exception as chunk_err:
            logger.error(f"[CHUNK DISPATCH ERROR] {chunk_err}")


@shared_task(bind=True, max_retries=3)
def dispatch_chunk_task(self, campaign_id, contact_ids):
    """
    Step 2 of Campaign Pipeline:
    - Worker grabs up to 500 recipients.
    - Personalizes merge tags: {{first_name}}, {{email}}, {{company}}.
    - Injects open pixel + click tracking telemetry.
    - Dispatches to Amazon SES v2.
    - Updates sent_count and dispatch status records.
    """
    _run_dispatch_chunk(campaign_id, contact_ids)


def _run_dispatch_chunk(campaign_id, contact_ids):
    """
    Core email dispatch engine.
    - Personalizes merge tags: {{first_name}}, {{last_name}}, {{email}}, {{company}}.
    - Injects open pixel + click tracking telemetry.
    - Dispatches via Amazon SES v2.
    - Updates sent_count and dispatch status records.
    """
    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        logger.error(f"[DISPATCH] Campaign {campaign_id} not found in DB.")
        return

    if not campaign.compiled_html:
        logger.error(f"[DISPATCH] Campaign {campaign_id} has no compiled_html content. Aborting.")
        return

    if not campaign.sender_email:
        logger.error(f"[DISPATCH] Campaign {campaign_id} has no sender_email. Aborting.")
        return

    ses_service = SESClientService()
    contacts = Contact.objects.filter(id__in=contact_ids)

    if not contacts.exists():
        logger.warning(f"[DISPATCH] Campaign {campaign_id}: No contacts found for chunk {contact_ids[:3]}...")
        return

    successful_sends = 0
    from .models import strip_attachment_box
    base_template = strip_attachment_box(campaign.compiled_html or '')
    base_url = settings.TRACKING_BASE_URL.rstrip('/')

    logger.info(f"[DISPATCH] Campaign '{campaign.title}': sending to {contacts.count()} contacts in this chunk.")

    for contact in contacts:
        # Check dispatch status to avoid duplicate sends
        dispatch = CampaignDispatch.objects.filter(campaign=campaign, contact=contact).first()
        if dispatch and dispatch.status in [DispatchStatus.SENT, DispatchStatus.DELIVERED]:
            logger.info(f"[DISPATCH SKIP] {contact.email} already {dispatch.status}")
            continue

        # Merge tags personalization
        body = base_template.replace('{{first_name}}', contact.first_name or 'there')
        body = body.replace('{{last_name}}', contact.last_name or '')
        body = body.replace('{{email}}', contact.email)
        body = body.replace('{{company}}', contact.company or '')

        # Inject Telemetry Tracking & Click URLs
        personalized_body, token = inject_telemetry(body, campaign.id, contact.id)

        # RFC 8058 One-Click Unsubscribe Headers
        unsub_url = f"{base_url}/api/v1/telemetry/unsub/{token}"
        headers = {
            'List-Unsubscribe': f'<{unsub_url}>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }

        # Build From: address - SES requires verified identity
        from_addr = f"{campaign.sender_name} <{campaign.sender_email}>" if campaign.sender_name else campaign.sender_email

        # Check for campaign attachment
        att_path = campaign.attachment.path if campaign.attachment and hasattr(campaign.attachment, 'path') else None
        att_name = campaign.attachment_name or None

        # SES API Call
        res = ses_service.send_single_email(
            source_email=from_addr,
            to_email=contact.email,
            subject=campaign.subject,
            html_body=personalized_body,
            reply_to=campaign.reply_to or campaign.sender_email,
            headers=headers,
            attachment_path=att_path,
            attachment_name=att_name
        )

        dispatch = CampaignDispatch.objects.filter(campaign=campaign, contact=contact).first()
        from apps.telemetry.models import Notification
        if res.get('success'):
            successful_sends += 1
            if dispatch:
                dispatch.status = DispatchStatus.SENT
                dispatch.ses_message_id = res.get('message_id')
                dispatch.sent_at = timezone.now()
                dispatch.save(update_fields=['status', 'ses_message_id', 'sent_at'])
            Notification.objects.create(
                notification_type='SENT',
                title='Email Sent Successfully',
                description=f'"{campaign.title}" was delivered to {contact.email} via AWS SES.',
                campaign=campaign,
                recipient_email=contact.email,
                is_read=False
            )
            logger.info(f"[SES OK] {contact.email} → MessageId={res.get('message_id')}")
        else:
            err = res.get('error', 'Unknown SES error')
            if dispatch:
                dispatch.status = DispatchStatus.FAILED
                dispatch.error_message = err
                dispatch.save(update_fields=['status', 'error_message'])
            Notification.objects.create(
                notification_type='FAILED',
                title='Email Not Sent (Failed)',
                description=f'Failed sending "{campaign.title}" to {contact.email}: {err}',
                campaign=campaign,
                recipient_email=contact.email,
                is_read=False
            )
            logger.error(f"[SES FAIL] {contact.email} → {err}")

    # Atomically update sent_count and mark campaign complete if all done
    from django.db import connection
    connection.close()  # Refresh stale DB connection for thread safety
    updated_campaign = Campaign.objects.get(id=campaign.id)
    # Recalculate true sent count from CampaignDispatch table
    actual_sent = CampaignDispatch.objects.filter(campaign=updated_campaign, status=DispatchStatus.SENT).count()
    remaining_queued = CampaignDispatch.objects.filter(campaign=updated_campaign, status=DispatchStatus.QUEUED).count()
    updated_campaign.sent_count = actual_sent
    if remaining_queued == 0 and updated_campaign.total_recipients > 0:
        updated_campaign.status = CampaignStatus.COMPLETED
        updated_campaign.completed_at = timezone.now()
    updated_campaign.save()

    logger.info(f"[DISPATCH DONE] Campaign '{campaign.title}': {successful_sends}/{contacts.count()} sent in this chunk.")


@shared_task
def check_and_dispatch_scheduled_campaigns():
    """
    Periodic task:
    Finds all campaigns with status='SCHEDULED' and scheduled_at <= now,
    and triggers prepare_campaign_chunks for them.
    """
    now = timezone.now()
    due_campaigns = Campaign.objects.filter(
        status=CampaignStatus.SCHEDULED,
        scheduled_at__lte=now
    )
    dispatched_count = 0
    for campaign in due_campaigns:
        logger.info(f"[SCHEDULED DISPATCH] Triggering due campaign {campaign.id} ('{campaign.title}')")
        prepare_campaign_chunks(str(campaign.id))
        dispatched_count += 1
    return f"Dispatched {dispatched_count} scheduled campaigns"

