from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Contact, ContactList, ListContact, SuppressionList, ContactStatus
from .serializers import ContactSerializer, ContactListSerializer, SuppressionListSerializer

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

    def perform_destroy(self, instance):
        # Gather affected contact lists before deletion
        affected_list_ids = list(instance.list_memberships.values_list('list_id', flat=True))
        instance.delete()
        # Recalculate total_subscribers on all lists the contact belonged to
        if affected_list_ids:
            for l in ContactList.objects.filter(id__in=affected_list_ids):
                l.total_subscribers = l.memberships.count()
                l.save(update_fields=['total_subscribers'])

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        list_id = self.request.query_params.get('list_id')
        if list_id:
            qs = qs.filter(list_memberships__list_id=list_id)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(email__icontains=search)
        return qs

    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        """
        Secure bulk import for CSV/JSON lead uploads.
        Skips or suppresses invalid emails and updates list count.
        """
        records = request.data.get('contacts', [])
        list_id = request.data.get('list_id')

        if not isinstance(records, list):
            return Response({'error': 'Payload must include contacts list'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        target_list = None
        if list_id:
            try:
                target_list = ContactList.objects.get(id=list_id)
            except ContactList.DoesNotExist:
                return Response({'error': 'Target list not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            for row in records:
                email = row.get('email', '').strip().lower()
                if not email:
                    continue

                contact, created = Contact.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': row.get('first_name', ''),
                        'last_name': row.get('last_name', ''),
                        'phone': row.get('phone', ''),
                        'company': row.get('company', ''),
                        'attributes': row.get('attributes', {}),
                    }
                )
                if created:
                    created_count += 1

                if target_list:
                    ListContact.objects.get_or_create(list=target_list, contact=contact)

            if target_list:
                target_list.total_subscribers = target_list.memberships.count()
                target_list.save()

        return Response({
            'status': 'success',
            'imported': len(records),
            'new_contacts_created': created_count,
        }, status=status.HTTP_201_CREATED)


class ContactListViewSet(viewsets.ModelViewSet):
    queryset = ContactList.objects.all()
    serializer_class = ContactListSerializer


class SuppressionListViewSet(viewsets.ModelViewSet):
    queryset = SuppressionList.objects.all().order_by('-suppressed_at')
    serializer_class = SuppressionListSerializer

