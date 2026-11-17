from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Campaign, CampaignStatus, CampaignDispatch
from .serializers import CampaignSerializer, CampaignDispatchSerializer
from .tasks import prepare_campaign_chunks
from apps.telemetry.models import EmailEvent, EventType
from apps.contacts.models import Contact, ContactList, ListContact, SuppressionList, ContactStatus

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer

    def get_queryset(self):
        # Auto-trigger any scheduled campaigns that have reached their scheduled_at time
        try:
            from .tasks import check_and_dispatch_scheduled_campaigns
            check_and_dispatch_scheduled_campaigns()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Auto-dispatch check warning: {e}")

        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=False, methods=['post'], url_path='upload-attachment')
    def upload_attachment(self, request):
        """
        Uploads an attachment (e.g. PDF brochure, clinical study, document)
        and returns its relative path, filename, and full URL.
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        from django.core.files.storage import default_storage
        import os

        # Save file to media/attachments/
        save_path = os.path.join('attachments', file_obj.name)
        saved_name = default_storage.save(save_path, file_obj)
        file_url = default_storage.url(saved_name)
        full_url = request.build_absolute_uri(file_url)

        return Response({
            'attachment': saved_name,
            'attachment_name': file_obj.name,
            'attachment_url': full_url,
            'file_size': file_obj.size,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='dashboard-overview')
    def dashboard_overview(self, request):
        """
        Computes aggregate metrics directly from AWS RDS across all campaigns & events.
        Uses Zoho-style: open/click rates computed from the email_events table (unique per contact).
        """
        from django.db.models import Sum, Count
        totals = Campaign.objects.aggregate(
            total_sent=Sum('sent_count'),
            total_delivered=Sum('delivered_count'),
            total_bounces=Sum('bounce_count'),
            total_complaints=Sum('complaint_count'),
        )

        sent = totals['total_sent'] or 0
        delivered = totals['total_delivered'] or 0
        bounces = totals['total_bounces'] or 0
        complaints = totals['total_complaints'] or 0

        # Unique opens and clicks from the telemetry event log (Zoho standard)
        opens = (
            EmailEvent.objects
            .filter(event_type=EventType.OPEN)
            .values('campaign_id', 'contact_id').distinct().count()
        )
        clicks = (
            EmailEvent.objects
            .filter(event_type=EventType.CLICK)
            .values('campaign_id', 'contact_id').distinct().count()
        )

        delivery_rate = round((delivered / sent * 100), 1) if sent > 0 else 100.0
        avg_open_rate = round((opens / sent * 100), 1) if sent > 0 else 0.0
        avg_click_rate = round((clicks / sent * 100), 1) if sent > 0 else 0.0
        bounce_rate = round((bounces / sent * 100), 2) if sent > 0 else 0.0
        spam_rate = round((complaints / sent * 100), 3) if sent > 0 else 0.0

        # Recent dispatches/feed
        recent_events = EmailEvent.objects.select_related('contact', 'campaign').order_by('-occurred_at')[:10]
        feed = []
        for e in recent_events:
            email_addr = e.contact.email if e.contact else "Anonymous"
            action_desc = f"{e.get_event_type_display()} on {e.campaign.title}"
            if e.url_clicked:
                action_desc += f" → {e.url_clicked}"
            feed.append({
                'email': email_addr,
                'status': e.get_event_type_display(),
                'action': action_desc,
                'occurred_at': e.occurred_at.strftime('%Y-%m-%d %H:%M'),
            })

        return Response({
            'stats': {
                'totalSent': sent,
                'deliveryRate': delivery_rate,
                'avgOpenRate': avg_open_rate,
                'avgClickRate': avg_click_rate,
                'bounceRate': bounce_rate,
                'spamRate': spam_rate,
                'totalContacts': Contact.objects.count(),
                'totalCampaigns': Campaign.objects.count(),
            },
            'feed': feed,
        })

    @action(detail=True, methods=['post'], url_path='test-send')
    def test_send(self, request, pk=None):
        """
        Send a test email copy to any email address.
        POST body: { "test_email": "you@example.com" }
        """
        campaign = self.get_object()
        test_email = request.data.get('test_email', '').strip()
        if not test_email:
            return Response({'error': 'test_email is required'}, status=status.HTTP_400_BAD_REQUEST)

        from .services import SESClientService
        ses = SESClientService()

        html = campaign.compiled_html or '<p>No email content set.</p>'
        html = html.replace('{{first_name}}', 'Test').replace('{{last_name}}', 'User')
        html = html.replace('{{email}}', test_email).replace('{{company}}', 'Test Co')

        result = ses.send_single_email(
            source_email=f"{campaign.sender_name} <{campaign.sender_email}>",
            to_email=test_email,
            subject=f"[TEST] {campaign.subject}",
            html_body=html,
        )

        if result.get('success'):
            return Response({'status': 'sent', 'message_id': result.get('message_id'), 'to': test_email})
        else:
            return Response({'status': 'failed', 'error': result.get('error')}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=True, methods=['post'], url_path='send')
    def launch_campaign(self, request, pk=None):
        campaign = self.get_object()

        if campaign.status == CampaignStatus.PROCESSING:
            return Response({'error': 'Campaign is already processing.'}, status=status.HTTP_400_BAD_REQUEST)

        if not campaign.subject or not campaign.sender_email:
            return Response({'error': 'Subject and sender email are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not campaign.compiled_html:
            return Response({'error': 'Campaign email content (HTML) is empty. Please set template content before sending.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate that the campaign has targeted contact lists with eligible contacts
        target_lists = campaign.target_lists.all()
        if not target_lists.exists():
            return Response({
                'error': 'Cannot send campaign: No audience contact list is assigned. Please edit the campaign and select at least one contact list.'
            }, status=status.HTTP_400_BAD_REQUEST)

        suppressed_emails = set(SuppressionList.objects.values_list('email', flat=True))
        eligible_contacts_count = (
            ListContact.objects
            .filter(list__in=target_lists, contact__status=ContactStatus.ACTIVE)
            .exclude(contact__email__in=suppressed_emails)
            .values('contact_id')
            .distinct()
            .count()
        )

        if eligible_contacts_count == 0:
            return Response({
                'error': f'Cannot send campaign: The assigned list(s) contain 0 active/eligible contacts. Please add contacts to the list before sending.'
            }, status=status.HTTP_400_BAD_REQUEST)

        print(f"[LAUNCH] Triggering dispatch for Campaign '{campaign.title}' (ID: {campaign.id}) with {eligible_contacts_count} recipients")
        # Immediate synchronous execution (0-second delay directly via AWS SES)
        prepare_campaign_chunks(str(campaign.id))
        campaign.refresh_from_db()
        print(f"[LAUNCH DONE] Campaign '{campaign.title}' status is now: {campaign.status}")

        return Response({
            'status': 'completed' if campaign.status == CampaignStatus.COMPLETED else 'sent',
            'message': f'Campaign "{campaign.title}" dispatched immediately via AWS SES to {eligible_contacts_count} contacts.'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='schedule')
    def schedule_campaign(self, request, pk=None):
        campaign = self.get_object()
        scheduled_at = request.data.get('scheduled_at')

        if not scheduled_at:
            return Response({'error': 'scheduled_at datetime is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not campaign.subject or not campaign.sender_email:
            return Response({'error': 'Subject and sender email are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not campaign.compiled_html:
            return Response({'error': 'Campaign email content (HTML) is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        target_lists = campaign.target_lists.all()
        if not target_lists.exists():
            return Response({'error': 'No audience contact list is assigned. Please select at least one contact list.'}, status=status.HTTP_400_BAD_REQUEST)

        suppressed_emails = set(SuppressionList.objects.values_list('email', flat=True))
        eligible_contacts_count = (
            ListContact.objects
            .filter(list__in=target_lists, contact__status=ContactStatus.ACTIVE)
            .exclude(contact__email__in=suppressed_emails)
            .values('contact_id')
            .distinct()
            .count()
        )

        from django.utils.dateparse import parse_datetime
        parsed_dt = parse_datetime(scheduled_at)
        if not parsed_dt:
            return Response({'error': 'Invalid datetime format. Expected ISO-8601 string.'}, status=status.HTTP_400_BAD_REQUEST)

        campaign.scheduled_at = parsed_dt
        campaign.status = CampaignStatus.SCHEDULED
        campaign.total_recipients = eligible_contacts_count
        campaign.save(update_fields=['scheduled_at', 'status', 'total_recipients'])

        return Response({
            'status': 'SCHEDULED',
            'scheduled_at': campaign.scheduled_at.isoformat(),
            'total_recipients': eligible_contacts_count,
            'message': f'Campaign "{campaign.title}" successfully scheduled for {campaign.scheduled_at.isoformat()} ({eligible_contacts_count} recipients).'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='stats')
    def campaign_stats(self, request, pk=None):
        campaign = self.get_object()
        # Zoho standard: rates are calculated against sent_count (emails actually dispatched)
        # Fall back to total_recipients if sent_count is 0 (e.g. freshly queued)
        denominator = campaign.sent_count or campaign.total_recipients or 1

        # Unique open/click counts from the event log (deduplicated per contact)
        from django.db.models import Count
        unique_opens = (
            EmailEvent.objects.filter(campaign=campaign, event_type=EventType.OPEN)
            .values('contact_id').distinct().count()
        )
        unique_clicks = (
            EmailEvent.objects.filter(campaign=campaign, event_type=EventType.CLICK)
            .values('contact_id').distinct().count()
        )

        open_rate = round((unique_opens / denominator) * 100, 2)
        click_rate = round((unique_clicks / denominator) * 100, 2)
        bounce_rate = round((campaign.bounce_count / denominator) * 100, 2)

        # Recipients dispatches list
        dispatches = CampaignDispatch.objects.filter(campaign=campaign).select_related('contact').order_by('-sent_at')
        recipients_list = []
        for d in dispatches:
            recipients_list.append({
                'id': str(d.id),
                'email': d.contact.email if d.contact else '—',
                'name': f"{d.contact.first_name} {d.contact.last_name}".strip() if d.contact else '—',
                'company': d.contact.company if d.contact else '—',
                'status': d.status,
                'ses_message_id': d.ses_message_id or '—',
                'sent_at': d.sent_at.strftime('%Y-%m-%d %H:%M:%S') if d.sent_at else '—',
                'error_message': d.error_message or '',
            })

        # Sync aggregate counters from the event log (source of truth)
        campaign.open_count = unique_opens
        campaign.click_count = unique_clicks
        campaign.save(update_fields=['open_count', 'click_count'])

        return Response({
            'campaign_id': str(campaign.id),
            'title': campaign.title,
            'subject': campaign.subject,
            'preheader': campaign.preheader,
            'sender_email': campaign.sender_email,
            'sender_name': campaign.sender_name,
            'compiled_html': campaign.compiled_html or '',
            'status': campaign.status,
            'total_recipients': campaign.total_recipients,
            'sent_count': campaign.sent_count,
            # Delivered = sent if no SES webhook configured yet
            'delivered_count': campaign.delivered_count or campaign.sent_count,
            # Use unique event-log counts (Zoho-style: deduplicated per contact)
            'open_count': unique_opens,
            'click_count': unique_clicks,
            'bounce_count': campaign.bounce_count,
            'complaint_count': campaign.complaint_count,
            'unsubscribe_count': campaign.unsubscribe_count,
            'open_rate_percent': open_rate,
            'click_rate_percent': click_rate,
            'bounce_rate_percent': bounce_rate,
            # Zoho CTOR: click rate out of openers
            'click_to_open_rate': round((unique_clicks / unique_opens * 100), 2) if unique_opens > 0 else 0.0,
            'recipients_dispatched': recipients_list,
        })


class CampaignDispatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CampaignDispatch.objects.all().select_related('contact', 'campaign')
    serializer_class = CampaignDispatchSerializer
    filterset_fields = ['campaign', 'status']
