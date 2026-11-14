import os
import sys

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.telemetry.models import EmailEvent
from apps.campaigns.models import CampaignDispatch, Campaign
from apps.contacts.models import ListContact, ContactList, Contact, SuppressionList

def wipe_database():
    print("==================================================")
    print("⚠️  WIPING ALL DATA FROM DATABASE (RESET TO ZERO)")
    print("==================================================")

    # 1. Telemetry Events
    events_deleted = EmailEvent.objects.all().delete()[0]
    print(f"[-] Deleted Email Events: {events_deleted}")

    # 2. Campaign Dispatches
    dispatches_deleted = CampaignDispatch.objects.all().delete()[0]
    print(f"[-] Deleted Campaign Dispatches: {dispatches_deleted}")

    # 3. Campaigns
    campaigns_deleted = Campaign.objects.all().delete()[0]
    print(f"[-] Deleted Campaigns: {campaigns_deleted}")

    # 4. List Memberships (through-table)
    memberships_deleted = ListContact.objects.all().delete()[0]
    print(f"[-] Deleted List-Contact Memberships: {memberships_deleted}")

    # 5. Contact Lists
    lists_deleted = ContactList.objects.all().delete()[0]
    print(f"[-] Deleted Contact Lists: {lists_deleted}")

    # 6. Contacts
    contacts_deleted = Contact.objects.all().delete()[0]
    print(f"[-] Deleted Contacts: {contacts_deleted}")

    # 7. Suppression List
    suppressions_deleted = SuppressionList.objects.all().delete()[0]
    print(f"[-] Deleted Suppression List Records: {suppressions_deleted}")

    print("==================================================")
    print("✅ DATABASE IS NOW COMPLETELY CLEAN & RESET TO ZERO")
    print("==================================================")

if __name__ == '__main__':
    wipe_database()

