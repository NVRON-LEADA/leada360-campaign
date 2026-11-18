from django.db import migrations
import re

def strip_inbody_attachment_box(apps, schema_editor):
    Campaign = apps.get_model('campaigns', 'Campaign')
    pattern = re.compile(
        r'<div[^>]*padding:\s*14px\s+18px[^>]*>[\s\S]*?<\/table>\s*<\/div>',
        re.IGNORECASE
    )
    for c in Campaign.objects.all():
        if c.compiled_html and 'Official Attached Document' in c.compiled_html:
            c.compiled_html = pattern.sub('', c.compiled_html)
            c.save(update_fields=['compiled_html'])

class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0003_emailtemplate'),
    ]

    operations = [
        migrations.RunPython(strip_inbody_attachment_box, reverse_code=migrations.RunPython.noop),
    ]
