import uuid
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile, UserInvitation
from .serializers import UserSerializer, UserInvitationSerializer

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lookup user by username or email
        user = None
        try:
            user_obj = User.objects.filter(email__iexact=email).first() or User.objects.filter(username__iexact=email).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not user:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is inactive. Please contact an administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Ensure user profile exists
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'super_admin' if user.is_superuser else 'admin'}
        )
        if user.is_superuser and profile.role != 'super_admin':
            profile.role = 'super_admin'
            profile.save()

        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': profile.role,
                'is_superuser': user.is_superuser,
            }
        })


class UserListView(APIView):
    def get(self, request):
        users = User.objects.select_related('profile').all().order_by('-date_joined')
        return Response({
            'users': UserSerializer(users, many=True).data
        })


class InviteUserView(APIView):
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        role = request.data.get('role', 'admin').strip()
        inviter_email = request.data.get('inviter_email', '').strip()

        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': f'A user with email {email} already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine inviter user
        inviter = None
        if inviter_email:
            inviter = User.objects.filter(email__iexact=inviter_email).first()
        if not inviter:
            inviter = User.objects.filter(is_superuser=True).first() or User.objects.first()

        invitation = UserInvitation.objects.create(
            email=email,
            role=role if role in dict(UserProfile.ROLE_CHOICES) else 'admin',
            invited_by=inviter,
            status='pending',
            expires_at=timezone.now() + timezone.timedelta(days=7)
        )

        return Response({
            'success': True,
            'message': f'Invitation successfully created for {email}.',
            'invitation': UserInvitationSerializer(invitation).data
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        invitations = UserInvitation.objects.select_related('invited_by').all().order_by('-created_at')
        return Response({
            'invitations': UserInvitationSerializer(invitations, many=True).data
        })


class AcceptInviteView(APIView):
    def post(self, request):
        token = request.data.get('token')
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        password = request.data.get('password', '')

        if not token or not password:
            return Response({'error': 'Invite token and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitation = UserInvitation.objects.get(id=token, status='pending')
        except UserInvitation.DoesNotExist:
            return Response({'error': 'Invalid or expired invitation token.'}, status=status.HTTP_404_NOT_FOUND)

        if invitation.is_expired:
            invitation.status = 'expired'
            invitation.save()
            return Response({'error': 'This invitation link has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists
        user = User.objects.filter(email__iexact=invitation.email).first()
        if not user:
            user = User.objects.create_user(
                username=invitation.email,
                email=invitation.email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
        else:
            user.set_password(password)
            user.first_name = first_name
            user.last_name = last_name
            user.is_active = True
            user.save()

        # Update or create profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = invitation.role
        profile.invited_by = invitation.invited_by
        profile.is_active = True
        profile.save()

        invitation.status = 'accepted'
        invitation.save()

        return Response({
            'success': True,
            'message': 'Account created successfully! You can now log in.',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': profile.role
            }
        })
