-- LeadA360 Campaign Database Initialization Schema
-- Optimized for PostgreSQL 16
-- Target Volume: 300,000 Emails / Day

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Contacts Table (Leads & Subscribers)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL UNIQUE,
    first_name VARCHAR(150) DEFAULT '',
    last_name VARCHAR(150) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    company VARCHAR(200) DEFAULT '',
    attributes JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_email_status ON contacts (email, status);
CREATE INDEX IF NOT EXISTS idx_contacts_status_created ON contacts (status, created_at);

-- 2. Contact Lists
CREATE TABLE IF NOT EXISTS contact_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    total_subscribers INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Membership Through-Table (List <-> Contacts)
CREATE TABLE IF NOT EXISTS list_contacts (
    id BIGSERIAL PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_list_contact UNIQUE (list_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_list_contacts_lookup ON list_contacts (list_id, contact_id);

-- 4. Global Suppression List (RFC & SES Compliance)
CREATE TABLE IF NOT EXISTS suppression_list (
    email VARCHAR(254) PRIMARY KEY,
    reason VARCHAR(30) NOT NULL DEFAULT 'HARD_BOUNCE',
    source_campaign_id VARCHAR(100),
    suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppression_reason ON suppression_list (email, reason);

-- 5. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    preheader VARCHAR(255) DEFAULT '',
    sender_name VARCHAR(150) NOT NULL,
    sender_email VARCHAR(254) NOT NULL,
    reply_to VARCHAR(254) DEFAULT '',
    campaign_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    mjml_content TEXT DEFAULT '',
    compiled_html TEXT DEFAULT '',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    open_count INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    bounce_count INTEGER NOT NULL DEFAULT 0,
    complaint_count INTEGER NOT NULL DEFAULT 0,
    unsubscribe_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns (scheduled_at);

-- 6. Campaign Dispatches (Idempotency and Tracking)
CREATE TABLE IF NOT EXISTS campaign_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    ses_message_id VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    error_message TEXT DEFAULT '',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    CONSTRAINT uq_campaign_contact UNIQUE (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_dispatches_campaign_status ON campaign_dispatches (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatches_ses_id ON campaign_dispatches (ses_message_id);

-- 7. Email Telemetry Events (Click & Open Log)
CREATE TABLE IF NOT EXISTS email_events (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL,
    url_clicked TEXT DEFAULT '',
    ip_address INET,
    user_agent TEXT DEFAULT '',
    raw_payload JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_campaign_type_time ON email_events (campaign_id, event_type, occurred_at DESC);

