from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='campaign',
            name='attachment',
            field=models.FileField(blank=True, help_text='PDF or document attachment', null=True, upload_to='attachments/'),
        ),
        migrations.AddField(
            model_name='campaign',
            name='attachment_name',
            field=models.CharField(blank=True, default='', help_text='Original uploaded attachment filename', max_length=255),
        ),
    ]
