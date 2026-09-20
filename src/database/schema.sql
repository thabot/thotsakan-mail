-- Schema DDL v3 for Thotsakan Mail Engine
-- Pragmas are executed via driver connection

CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 120,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  PRIMARY KEY (key, tenant_id)
);

CREATE TABLE IF NOT EXISTS suppression_list (
  email TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  reason TEXT NOT NULL, -- 'BOUNCE' | 'SPAM' | 'MANUAL' | 'UNSUBSCRIBE'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (email, tenant_id)
);

CREATE TABLE IF NOT EXISTS provider_limits (
  provider_type TEXT PRIMARY KEY,
  rate_limit_per_minute INTEGER NOT NULL,
  daily_quota_limit INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  credentials TEXT NOT NULL, -- AES-256-GCM Encrypted JSON
  from_email TEXT NOT NULL,
  from_name TEXT,
  daily_quota_limit INTEGER NOT NULL DEFAULT 10000,
  daily_quota_used INTEGER NOT NULL DEFAULT 0,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  fallback_account_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  token_cache TEXT, -- AES-256-GCM Encrypted
  token_expires_at TEXT,
  secret_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (fallback_account_id) REFERENCES email_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  html_content TEXT NOT NULL,
  mjml_content TEXT,
  text_content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS email_logs (
  job_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT,
  provider_used TEXT,
  to_recipients TEXT NOT NULL, -- JSON Array of emails
  subject TEXT NOT NULL,
  status TEXT NOT NULL, -- 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'THROTTLED' | 'FALLBACK' | 'DELIVERED' | 'BOUNCED' | 'SUPPRESSED'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'high' | 'normal' | 'low'
  scheduled_at TEXT NOT NULL DEFAULT (datetime('now')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  message_id TEXT,
  error_details TEXT,
  attempts_history TEXT, -- JSON Array of attempt results
  save_to_sent_items INTEGER NOT NULL DEFAULT 0,
  is_sync INTEGER NOT NULL DEFAULT 0,
  message_payload TEXT, -- Serialized JSON of EmailMessage for async dispatch
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT,
  opened_at TEXT,
  open_count INTEGER NOT NULL DEFAULT 0,
  clicked_at TEXT,
  click_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS routing_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT NOT NULL, -- 'domain_match' | 'subject_contains' | 'recipient_regex'
  condition_value TEXT NOT NULL,
  target_account_id TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (target_account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
);

-- High-performance Indices
CREATE INDEX IF NOT EXISTS idx_email_queue 
  ON email_logs(priority DESC, scheduled_at ASC) 
  WHERE status IN ('PENDING', 'THROTTLED');

CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_status 
  ON email_logs(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suppression 
  ON suppression_list(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_routing_rules_tenant 
  ON routing_rules(tenant_id, priority DESC);

-- System Metadata (Clock Tampering Protection & Operational State)
CREATE TABLE IF NOT EXISTS system_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cluster Nodes (Multi-Node Coordination & Heartbeats)
CREATE TABLE IF NOT EXISTS cluster_nodes (
  machine_id TEXT PRIMARY KEY,
  hostname TEXT NOT NULL,
  ip_address TEXT,
  pid INTEGER NOT NULL,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_heartbeat_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1
);


