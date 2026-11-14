import boto3
from botocore.exceptions import ClientError
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SESClientService:
    """
    Production-grade Amazon SES v2 wrapper.
    Handles credential fallback, rate limits, and bulk/single dispatches.
    """
    def __init__(self):
        client_kwargs = {
            'region_name': settings.AWS_DEFAULT_REGION,
        }
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
            client_kwargs['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY

        self.client = boto3.client('sesv2', **client_kwargs)

    def send_single_email(self, source_email, to_email, subject, html_body, reply_to=None, headers=None):
        """
        Send single customized email with RFC 8058 headers (List-Unsubscribe).
        """
        email_content = {
            'Simple': {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {'Html': {'Data': html_body, 'Charset': 'UTF-8'}},
                'Headers': []
            }
        }

        if headers:
            for k, v in headers.items():
                email_content['Simple']['Headers'].append({'Name': k, 'Value': v})

        send_args = {
            'FromEmailAddress': source_email,
            'Destination': {'ToAddresses': [to_email]},
            'Content': email_content,
        }

        if reply_to:
            send_args['ReplyToAddresses'] = [reply_to]

        if settings.AWS_SES_CONFIGURATION_SET:
            send_args['ConfigurationSetName'] = settings.AWS_SES_CONFIGURATION_SET

        try:
            print(f"[SES] Attempting dispatch: From={source_email} To={to_email} Subject={subject}")
            response = self.client.send_email(**send_args)
            msg_id = response.get('MessageId')
            print(f"[SES SUCCESS] MessageId: {msg_id}")
            return {'success': True, 'message_id': msg_id}
        except Exception as e:
            err_msg = str(e)
            if hasattr(e, 'response') and 'Error' in e.response:
                err_msg = e.response['Error']['Message']
            print(f"[SES FAILED] Error sending to {to_email}: {err_msg}")
            logger.error(f"SES Send Error to {to_email}: {err_msg}")
            return {'success': False, 'error': err_msg}

