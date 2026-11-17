from rest_framework import serializers
from .models import Contact, ContactList, ListContact, SuppressionList

class ContactListSerializer(serializers.ModelSerializer):
    subscriber_count = serializers.SerializerMethodField()

    class Meta:
        model = ContactList
        fields = ['id', 'name', 'description', 'total_subscribers', 'subscriber_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_subscriber_count(self, obj):
        # Prefer direct total_subscribers if populated to avoid N+1 queries during large list serialization
        if hasattr(obj, 'annotated_subscribers'):
            return obj.annotated_subscribers
        return obj.total_subscribers or obj.memberships.count()

class ContactSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    list_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    list_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'company',
            'attributes', 'status', 'list_id', 'list_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'email': {'validators': []},  # Handled gracefully in create() via upsert
        }

    def get_list_name(self, obj):
        first_membership = obj.list_memberships.select_related('list').first()
        return first_membership.list.name if first_membership else 'General'

    def create(self, validated_data):
        list_id = validated_data.pop('list_id', None)
        email = validated_data.get('email', '').strip().lower()

        # Graceful Upsert: If email already exists, update contact info & add to list
        contact = Contact.objects.filter(email=email).first()
        if contact:
            for attr, val in validated_data.items():
                if val:
                    setattr(contact, attr, val)
            contact.save()
        else:
            contact = super().create(validated_data)

        if list_id:
            try:
                target_list = ContactList.objects.get(id=list_id)
                ListContact.objects.get_or_create(list=target_list, contact=contact)
                target_list.total_subscribers = target_list.memberships.count()
                target_list.save(update_fields=['total_subscribers'])
            except ContactList.DoesNotExist:
                pass
        return contact

class SuppressionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuppressionList
        fields = ['email', 'reason', 'source_campaign_id', 'suppressed_at']
        read_only_fields = ['suppressed_at']
