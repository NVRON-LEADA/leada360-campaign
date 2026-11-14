# LeadA360 Campaign Backend

High-throughput, production-ready backend engine for email marketing campaigns capable of handling **300,000 emails/day** via Amazon SES v2.

---

## Architecture & Technology Stack

- **Framework**: Python 3.12 / Django 5.1 / Django REST Framework
- **Task Queue & Scheduler**: Celery 5.4 + Redis 7
- **Database**: PostgreSQL 16 (Relational integrity, JSONB custom attributes, connection pooling)
- **Email Delivery**: Amazon SES v2 (`send_email` / `send_bulk_email` via `boto3`)
- **Telemetry**: Open pixel engine (`/o/<token>.png`), Click redirection tracking (`/c/<token>`), and RFC 8058 One-Click Unsubscribe (`/unsub/<token>`)
- **Event Processor**: Webhook consumer for AWS SES / SNS real-time Bounces, Complaints, and Deliveries

---

## Database Tables & Schema

1. `contacts`: Leads/Subscribers with UUID primary keys, dynamic `attributes` JSONB, status tracking.
2. `contact_lists`: List groups (e.g. "Product Launch", "VIP Buyers").
3. `list_contacts`: Many-to-Many membership through-table with subscription timestamp.
4. `suppression_list`: Global bounce/complaint/unsubscribe registry checked prior to any outbound chunk.
5. `campaigns`: Marketing blast entity, MJML markup, responsive HTML, and real-time aggregated metrics.
6. `campaign_dispatches`: Idempotent per-contact dispatch records holding SES `MessageId` and send timestamps.
7. `email_events`: High-speed append-only telemetry events log (`OPEN`, `CLICK`, `BOUNCE`, `COMPLAINT`).

---

## Running with Docker Compose (Recommended)

To launch the complete cluster (Postgres, Redis, Django API, Celery Workers, Celery Beat):

```bash
docker compose up --build
```

The API will be available at: `http://localhost:8000/api/v1/`

---

## Running Locally with Python Virtualenv

### 1. Requirements
Ensure Python 3.11+ and PostgreSQL are installed.

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your DB and AWS credentials:
```bash
cp .env.example .env
```

### 3. Run Migrations & Start Server
```bash
python manage.py makemigrations contacts campaigns telemetry
python manage.py migrate
python manage.py runserver 8000
```

### 4. Start Celery Worker & Beat
In separate terminals:
```bash
celery -A config worker --loglevel=info
celery -A config beat --loglevel=info
```

---

## Key API Endpoints

- `POST /api/v1/contacts/contacts/bulk-import/` - Bulk import CSV/JSON leads
- `GET /api/v1/contacts/lists/` - Manage lists
- `POST /api/v1/campaigns/{id}/send/` - Launch campaign background dispatch
- `GET /api/v1/campaigns/{id}/stats/` - Fetch real-time delivery and engagement metrics
- `GET /api/v1/telemetry/o/{token}.png` - 1x1 transparent open pixel
- `GET /api/v1/telemetry/c/{token}?d={encoded_destination}` - 302 tracking redirect
- `POST /api/v1/telemetry/unsub/{token}` - RFC 8058 one-click unsubscribe
- `POST /api/v1/telemetry/webhook/ses` - SNS webhook receiver for SES bounces and complaints

