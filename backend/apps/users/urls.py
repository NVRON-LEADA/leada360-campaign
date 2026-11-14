from django.urls import path
from .views import LoginView, UserListView, InviteUserView, AcceptInviteView

urlpatterns = [
    path('login/', LoginView.as_view(), name='user-login'),
    path('list/', UserListView.as_view(), name='user-list'),
    path('invite/', InviteUserView.as_view(), name='user-invite'),
    path('accept-invite/', AcceptInviteView.as_view(), name='user-accept-invite'),
]

