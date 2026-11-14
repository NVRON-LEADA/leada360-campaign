from django.urls import path
from .views import (
    OpenTrackingView, ClickTrackingView, UnsubscribeView, 
    SESWebhookView, EmailEventListView, NotificationsView
)

urlpatterns = [
    path('o/<str:token>.png', OpenTrackingView.as_view(), name='open_tracking'),
    path('c/<str:token>', ClickTrackingView.as_view(), name='click_tracking'),
    path('unsub/<str:token>', UnsubscribeView.as_view(), name='unsubscribe'),
    path('webhook/ses', SESWebhookView.as_view(), name='ses_webhook'),
    path('events/', EmailEventListView.as_view(), name='event_list'),
    path('notifications/', NotificationsView.as_view(), name='notifications_list'),
]

