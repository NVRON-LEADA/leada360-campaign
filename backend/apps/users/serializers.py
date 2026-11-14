from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, UserInvitation

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    department = serializers.CharField(source='profile.department', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_superuser', 'is_staff', 'is_active', 'date_joined',
            'last_login', 'role', 'phone', 'department'
        ]


class UserInvitationSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.CharField(source='invited_by.email', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserInvitation
        fields = [
            'id', 'email', 'role', 'status', 'invited_by_email',
            'created_at', 'expires_at', 'is_expired'
        ]

