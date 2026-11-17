import base64
import json
import logging
from datetime import datetime
from django.http import HttpResponse, HttpResponseRedirect
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from apps.campaigns.models import Campaign, CampaignDispatch, DispatchStatus
from apps.contacts.models import Contact, ContactStatus, SuppressionList, SuppressionReason
from .models import EmailEvent, EventType, Notification

logger = logging.getLogger(__name__)

# 1x1 transparent GIF image bytes
TRANSPARENT_GIF_BYTES = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")

def decode_token(token):
    try:
        data = json.loads(base64.urlsafe_b64decode(token.encode()).decode())
        return data.get('c'), data.get('u')
    except Exception:
        return None, None


class OpenTrackingView(View):
    """
    Tracking Pixel: /api/v1/telemetry/o/<token>.png
    Returns 1x1 pixel within < 20ms and logs OPEN event.
    """
    def get(self, request, token):
        campaign_id, contact_id = decode_token(token)
        if campaign_id and contact_id:
            try:
                ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
                ua = request.META.get('HTTP_USER_AGENT', '')

                EmailEvent.objects.create(
                    campaign_id=campaign_id,
                    contact_id=contact_id,
                    event_type=EventType.OPEN,
                    ip_address=ip if ip else None,
                    user_agent=ua
                )
                Campaign.objects.filter(id=campaign_id).update(open_count=F('open_count') + 1)
                
                # Create persistent notification
                contact = Contact.objects.filter(id=contact_id).first()
                campaign = Campaign.objects.filter(id=campaign_id).first()
                if contact and campaign:
                    Notification.objects.create(
                        notification_type='OPENED',
                        recipient_email=contact.email,
                        campaign=campaign,
                        title='Email Opened',
                        description=f'{contact.email} opened "{campaign.title}".',
                        is_read=False
                    )
            except Exception as e:
                logger.error(f"Error logging open tracking event: {e}")

        response = HttpResponse(TRANSPARENT_GIF_BYTES, content_type="image/gif")
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


class ClickTrackingView(View):
    """
    Click Redirect Tracker: /api/v1/telemetry/c/<token>?target=<url>
    Logs CLICK event and redirects user to intended target.
    """
    def get(self, request, token):
        # Support both ?d=<base64> (standard encoder) and ?target=<url>
        target_url = request.GET.get('target')
        d_param = request.GET.get('d')
        if not target_url and d_param:
            try:
                import base64
                target_url = base64.urlsafe_b64decode(d_param.encode()).decode()
            except Exception:
                target_url = None

        if not target_url:
            target_url = 'https://nvron.in'
        campaign_id, contact_id = decode_token(token)

        if campaign_id and contact_id:
            try:
                ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
                ua = request.META.get('HTTP_USER_AGENT', '')

                EmailEvent.objects.create(
                    campaign_id=campaign_id,
                    contact_id=contact_id,
                    event_type=EventType.CLICK,
                    url_clicked=target_url,
                    ip_address=ip if ip else None,
                    user_agent=ua
                )
                Campaign.objects.filter(id=campaign_id).update(click_count=F('click_count') + 1)
                
                # Create persistent notification
                contact = Contact.objects.filter(id=contact_id).first()
                campaign = Campaign.objects.filter(id=campaign_id).first()
                if contact and campaign:
                    Notification.objects.create(
                        notification_type='CLICKED',
                        recipient_email=contact.email,
                        campaign=campaign,
                        title='Link Clicked',
                        description=f'{contact.email} clicked link in "{campaign.title}".',
                        is_read=False
                    )
            except Exception as e:
                logger.error(f"Error logging click tracking event: {e}")

        return HttpResponseRedirect(target_url)


class UnsubscribeView(View):
    """
    One-Click Unsubscribe Handler: /api/v1/telemetry/unsub/<token>
    Automated suppression without friction.
    """
    def get(self, request, token):
        campaign_id, contact_id = decode_token(token)
        if campaign_id and contact_id:
            try:
                contact = Contact.objects.filter(id=contact_id).first()
                if contact:
                    contact.status = ContactStatus.UNSUBSCRIBED
                    contact.save(update_fields=['status'])

                    SuppressionList.objects.get_or_create(
                        email=contact.email,
                        defaults={
                            'reason': SuppressionReason.UNSUBSCRIBE,
                            'source_campaign_id': str(campaign_id)
                        }
                    )

                    EmailEvent.objects.create(
                        campaign_id=campaign_id,
                        contact_id=contact_id,
                        event_type=EventType.UNSUBSCRIBE
                    )
                    Campaign.objects.filter(id=campaign_id).update(unsubscribe_count=F('unsubscribe_count') + 1)
            except Exception as e:
                logger.error(f"Unsubscribe processing error: {e}")

        return HttpResponse(
            "<html><body style='font-family:sans-serif; text-align:center; padding:50px;'>"
            "<h2>You have been successfully unsubscribed.</h2>"
            "<p>You will no longer receive marketing communications from this sender.</p>"
            "</body></html>"
        )


@method_decorator(csrf_exempt, name='dispatch')
class SESWebhookView(APIView):
    """
    AWS SES SNS Notification Webhook.
    Handles Bounce, Complaint, and Delivery webhooks in real-time.
    """
    def post(self, request):
        try:
            payload = json.loads(request.body)
        except Exception:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle AWS SNS Subscription Confirmation
        if payload.get('Type') == 'SubscriptionConfirmation':
            subscribe_url = payload.get('SubscribeURL')
            logger.info(f"SNS Subscription Confirmation URL: {subscribe_url}")
            import urllib.request
            urllib.request.urlopen(subscribe_url)
            return Response({'status': 'subscribed'}, status=status.HTTP_200_OK)

        # Parse SES Message
        ses_msg_raw = payload.get('Message')
        if not ses_msg_raw:
            return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

        try:
            ses_data = json.loads(ses_msg_raw) if isinstance(ses_msg_raw, str) else ses_msg_raw
        except Exception:
            ses_data = {}

        event_type = ses_data.get('eventType') or ses_data.get('notificationType')
        mail = ses_data.get('mail', {})
        ses_msg_id = mail.get('messageId')

        # Find associated CampaignDispatch
        dispatch = None
        if ses_msg_id:
            dispatch = CampaignDispatch.objects.filter(ses_message_id=ses_msg_id).first()

        if event_type == 'Bounce':
            bounce = ses_data.get('bounce', {})
            bounce_type = bounce.get('bounceType')  # Permanent / Transient
            for recipient in bounce.get('bouncedRecipients', []):
                email = recipient.get('emailAddress')
                if email:
                    SuppressionList.objects.get_or_create(
                        email=email,
                        defaults={
                            'reason': SuppressionReason.HARD_BOUNCE if bounce_type == 'Permanent' else 'SOFT_BOUNCE',
                            'source_campaign_id': str(dispatch.campaign_id) if dispatch else None
                        }
                    )
                    Contact.objects.filter(email=email).update(status=ContactStatus.BOUNCED)

            if dispatch:
                dispatch.status = DispatchStatus.BOUNCED
                dispatch.save(update_fields=['status'])
                Campaign.objects.filter(id=dispatch.campaign_id).update(bounce_count=F('bounce_count') + 1)

        elif event_type == 'Complaint':
            complaint = ses_data.get('complaint', {})
            for recipient in complaint.get('complainedRecipients', []):
                email = recipient.get('emailAddress')
                if email:
                    SuppressionList.objects.get_or_create(
                        email=email,
                        defaults={
                            'reason': SuppressionReason.COMPLAINT,
                            'source_campaign_id': str(dispatch.campaign_id) if dispatch else None
                        }
                    )
                    Contact.objects.filter(email=email).update(status=ContactStatus.COMPLAINED)

            if dispatch:
                Campaign.objects.filter(id=dispatch.campaign_id).update(complaint_count=F('complaint_count') + 1)

        elif event_type == 'Delivery':
            if dispatch:
                dispatch.status = DispatchStatus.DELIVERED
                dispatch.save(update_fields=['status'])
                Campaign.objects.filter(id=dispatch.campaign_id).update(delivered_count=F('delivered_count') + 1)

        return Response({'status': 'processed'})


class EmailEventListView(APIView):
    """
    List recent telemetry events across all campaigns.
    GET /api/v1/telemetry/events/?limit=20&campaign_id=<uuid>
    """
    def get(self, request):
        campaign_id = request.query_params.get('campaign_id')
        limit = min(int(request.query_params.get('limit', 50)), 200)

        qs = EmailEvent.objects.select_related('contact', 'campaign').order_by('-occurred_at')
        if campaign_id:
            qs = qs.filter(campaign_id=campaign_id)
        qs = qs[:limit]

        results = []
        for e in qs:
            results.append({
                'id': e.id,
                'campaign_id': str(e.campaign_id),
                'campaign_title': e.campaign.title if e.campaign else '',
                'contact_email': e.contact.email if e.contact else 'unknown',
                'contact_name': f"{e.contact.first_name or ''} {e.contact.last_name or ''}".strip() if e.contact else '',
                'event_type': e.event_type,
                'event_label': e.get_event_type_display(),
                'url_clicked': e.url_clicked or '',
                'ip_address': str(e.ip_address) if e.ip_address else '',
                'occurred_at': e.occurred_at.strftime('%Y-%m-%d %H:%M:%S'),
            })

        return Response({'count': len(results), 'results': results})


class NotificationsView(APIView):
    """
    Persistent Database Notifications API:
    - GET: Query active notifications stored in PostgreSQL RDS
    - POST: Mark notifications as read / dismiss (mark all as done)
    """
    def get(self, request):
        qs = Notification.objects.select_related('campaign').all().order_by('-created_at')[:30]
        results = []
        for n in qs:
            results.append({
                'id': n.id,
                'type': n.notification_type.lower(),
                'title': n.title,
                'desc': n.description,
                'time': n.created_at.isoformat(),
                'unread': not n.is_read,
                'status': 'error' if n.notification_type in ['FAILED', 'BOUNCED'] else ('info' if n.notification_type in ['OPENED', 'CLICKED'] else 'success')
            })
        return Response({'notifications': results})

    def post(self, request):
        action = request.data.get('action', 'mark_all_read')
        notification_id = request.data.get('id')

        if action == 'mark_all_read':
            Notification.objects.filter(is_read=False).update(is_read=True)
            return Response({'status': 'success', 'message': 'All notifications marked as done in database.'})
        elif action == 'clear_all':
            Notification.objects.all().delete()
            return Response({'status': 'success', 'message': 'All notifications cleared.'})
        elif notification_id:
            Notification.objects.filter(id=notification_id).update(is_read=True)
            return Response({'status': 'success', 'message': f'Notification {notification_id} marked as read.'})

        return Response({'error': 'Unknown action'}, status=status.HTTP_400_BAD_REQUEST)
