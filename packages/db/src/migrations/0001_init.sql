CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL,
  email_digest text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  token_hash text NOT NULL,
  kind text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  rotated_at timestamptz
);

CREATE TABLE IF NOT EXISTS creator_profiles (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  handle text NOT NULL UNIQUE,
  display_name text NOT NULL,
  onboarding_state text NOT NULL,
  lane text NOT NULL,
  identity_state text NOT NULL,
  age_state text NOT NULL,
  sanctions_state text NOT NULL,
  jurisdiction text NOT NULL,
  member_since timestamptz NOT NULL,
  restricted boolean NOT NULL DEFAULT false,
  payout_hold boolean NOT NULL DEFAULT false,
  new_checkout_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT amount_lane_chk CHECK (lane IN ('ORDINARY', 'ADULT'))
);

CREATE TABLE IF NOT EXISTS transaction_links (
  id text PRIMARY KEY,
  creator_id text NOT NULL REFERENCES creator_profiles(id),
  share_id text NOT NULL UNIQUE,
  state text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  category text NOT NULL,
  delivery_duration text NOT NULL,
  lane text NOT NULL,
  note text,
  terms_hash text NOT NULL,
  activated_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS checkout_reservations (
  id text PRIMARY KEY,
  link_id text NOT NULL REFERENCES transaction_links(id),
  transaction_id text NOT NULL,
  idempotency_scope text NOT NULL,
  idempotency_key_hash text NOT NULL,
  state text NOT NULL,
  provider_configuration_id text NOT NULL,
  provider_checkout_id text,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  last_truth_check_at timestamptz,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS one_nonterminal_reservation_per_link
  ON checkout_reservations (link_id)
  WHERE state IN ('RESERVED', 'PROVIDER_CREATED', 'RECONCILIATION_HOLD');

CREATE UNIQUE INDEX IF NOT EXISTS reservation_provider_checkout_uq
  ON checkout_reservations (provider_configuration_id, provider_checkout_id)
  WHERE provider_checkout_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS transactions (
  id text PRIMARY KEY,
  link_id text NOT NULL REFERENCES transaction_links(id),
  creator_id text NOT NULL REFERENCES creator_profiles(id),
  public_order_code text NOT NULL UNIQUE,
  lane text NOT NULL,
  provider_configuration_id text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  snapshot_id text NOT NULL,
  payment_state text NOT NULL,
  fulfillment_state text NOT NULL,
  provider_authoritative_paid_at timestamptz,
  delivery_deadline_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS one_captured_transaction_per_link
  ON transactions (link_id)
  WHERE payment_state = 'CAPTURED';

CREATE TABLE IF NOT EXISTS transaction_terms_snapshots (
  id text PRIMARY KEY,
  transaction_id text NOT NULL,
  creator_id text NOT NULL,
  creator_handle text NOT NULL,
  creator_display_name text NOT NULL,
  amount_minor bigint NOT NULL,
  currency text NOT NULL CHECK (currency = 'USD'),
  category text NOT NULL,
  delivery_duration text NOT NULL,
  lane text NOT NULL,
  fee_schedule_version text NOT NULL,
  platform_fee_minor bigint NOT NULL,
  processor_fee_estimate_minor bigint NOT NULL,
  reserve_amount_minor bigint NOT NULL,
  buyer_protection_policy_version text NOT NULL,
  creator_agreement_version text NOT NULL,
  jurisdiction_policy_version text NOT NULL,
  compliance_policy_version text NOT NULL,
  provider_configuration_id text NOT NULL,
  merchant_portfolio_id text NOT NULL,
  statement_descriptor text NOT NULL,
  descriptor_is_synthetic boolean NOT NULL,
  tax_responsibility text NOT NULL,
  tax_amount_minor bigint NOT NULL,
  trust_snapshot_id text,
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  transaction_id text NOT NULL,
  provider_payment_id text,
  state text NOT NULL,
  amount_minor bigint NOT NULL,
  currency text NOT NULL CHECK (currency = 'USD'),
  captured_minor bigint NOT NULL,
  refunded_minor bigint NOT NULL CHECK (refunded_minor >= 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1,
  CHECK (refunded_minor <= captured_minor)
);

CREATE TABLE IF NOT EXISTS guest_transaction_credentials (
  id text PRIMARY KEY,
  transaction_id text NOT NULL,
  digest_hex text NOT NULL UNIQUE,
  key_version text NOT NULL,
  purpose text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  continuation_issued_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  id text PRIMARY KEY,
  scope text NOT NULL,
  key_hash text NOT NULL,
  request_hash text NOT NULL,
  result_json text NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (scope, key_hash)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  actor_json jsonb NOT NULL,
  action text NOT NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  before_digest text,
  after_digest text,
  reason text,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_jobs (
  id text PRIMARY KEY,
  type text NOT NULL,
  payload jsonb NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  available_at timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 8,
  state text NOT NULL,
  lease_until timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id text PRIMARY KEY,
  source_type text NOT NULL,
  source_id text NOT NULL,
  transaction_id text,
  currency text NOT NULL CHECK (currency = 'USD'),
  accounting_rule_version text NOT NULL,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_postings (
  id text PRIMARY KEY,
  entry_id text NOT NULL REFERENCES ledger_entries(id),
  account_code text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  creator_id text
);

CREATE OR REPLACE FUNCTION ledger_entry_must_balance() RETURNS trigger AS $$
DECLARE
  debit_sum bigint;
  credit_sum bigint;
BEGIN
  SELECT COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'DEBIT'), 0),
         COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'CREDIT'), 0)
    INTO debit_sum, credit_sum
  FROM ledger_postings WHERE entry_id = NEW.entry_id;
  IF debit_sum <> credit_sum THEN
    RAISE EXCEPTION 'ledger entry % is unbalanced debit=% credit=%', NEW.entry_id, debit_sum, credit_sum;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Balance is checked after postings for an entry exist; application also asserts before insert.

CREATE TABLE IF NOT EXISTS provider_events_inbox (
  id text PRIMARY KEY,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  key_version text NOT NULL,
  raw_digest text NOT NULL,
  signature_valid boolean NOT NULL,
  event_type text NOT NULL,
  schema_version integer NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  processed_at timestamptz,
  outcome text,
  payload jsonb,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  transaction_id text NOT NULL UNIQUE,
  creator_id text NOT NULL,
  state text NOT NULL,
  rating integer CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  body text,
  included_in_aggregate boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS refunds (
  id text PRIMARY KEY,
  transaction_id text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  state text NOT NULL,
  provider_refund_id text,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS internal_disputes (
  id text PRIMARY KEY,
  transaction_id text NOT NULL,
  state text NOT NULL,
  opened_by text NOT NULL,
  reason_code text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id text PRIMARY KEY,
  transaction_id text NOT NULL,
  reservation_id text NOT NULL,
  state text NOT NULL,
  redirect_url text,
  provider_checkout_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS kill_switches (
  name text PRIMARY KEY,
  enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL
);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('0001_init', now())
ON CONFLICT (version) DO NOTHING;
