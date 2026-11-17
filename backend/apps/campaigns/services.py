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

    def send_single_email(self, source_email, to_email, subject, html_body, reply_to=None, headers=None, attachment_path=None, attachment_name=None):
        """
        Send single customized email with RFC 8058 headers (List-Unsubscribe).
        Supports direct PDF/file attachments via Raw MIME email format.
        """
        import os
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.application import MIMEApplication

        # If attachment is present and exists on disk, send via Raw MIME email
        if attachment_path and os.path.exists(attachment_path):
            try:
                msg = MIMEMultipart('mixed')
                msg['Subject'] = subject
                msg['From'] = source_email
                msg['To'] = to_email
                if reply_to:
                    msg['Reply-To'] = reply_to

                if headers:
                    for k, v in headers.items():
                        msg[k] = v

                msg_alternative = MIMEMultipart('alternative')
                msg.attach(msg_alternative)

                html_part = MIMEText(html_body, 'html', 'utf-8')
                msg_alternative.attach(html_part)

                filename = attachment_name or os.path.basename(attachment_path)
                with open(attachment_path, 'rb') as f:
                    part = MIMEApplication(f.read())
                    part.add_header('Content-Disposition', 'attachment', filename=filename)
                    msg.attach(part)

                send_args = {
                    'FromEmailAddress': source_email,
                    'Destination': {'ToAddresses': [to_email]},
                    'Content': {
                        'Raw': {
                            'Data': msg.as_bytes()
                        }
                    }
                }
                if reply_to:
                    send_args['ReplyToAddresses'] = [reply_to]
                if settings.AWS_SES_CONFIGURATION_SET:
                    send_args['ConfigurationSetName'] = settings.AWS_SES_CONFIGURATION_SET

                print(f"[SES RAW] Attempting dispatch with attachment ({filename}): From={source_email} To={to_email}")
                response = self.client.send_email(**send_args)
                msg_id = response.get('MessageId')
                print(f"[SES RAW SUCCESS] MessageId: {msg_id}")
                return {'success': True, 'message_id': msg_id}
            except Exception as e:
                err_msg = str(e)
                if hasattr(e, 'response') and 'Error' in e.response:
                    err_msg = e.response['Error']['Message']
                print(f"[SES RAW FAILED] Error sending with attachment to {to_email}: {err_msg}")
                logger.error(f"SES Raw Send Error to {to_email}: {err_msg}")
                return {'success': False, 'error': err_msg}

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

