-- Additive repair: session truth, staff roles, secret envelopes, payouts,
-- FKs, unique financial sources, deferred journal balance, append-only ledger/audit.

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS auth_method text NOT NULL DEFAULT 'EMAIL_LINK',
  ADD COLUMN IF NOT EXISTS auth_strength text NOT NULL DEFAULT 'EMAIL_LINK',
  ADD COLUMN IF NOT EXISTS authenticated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS step_up_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

CREATE TABLE IF NOT EXISTS staff_role_grants (
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('SUPPORT','DISPUTES','RISK','COMPLIANCE','PAYMENTS','SECURITY')),
  granted_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, role)
);

INSERT INTO staff_role_grants (user_id, role, granted_at)
SELECT id, staff_role, now()
FROM users
WHERE staff_role IN ('SUPPORT','DISPUTES','RISK','COMPLIANCE','PAYMENTS','SECURITY')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS secret_envelopes (
  id text PRIMARY KEY,
  purpose text NOT NULL,
  credential_id text,
  ciphertext bytea,
  nonce bytea NOT NULL,
  auth_tag bytea,
  key_version text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS secret_envelopes_nonce_uq
  ON secret_envelopes (key_version, nonce);

CREATE TABLE IF NOT EXISTS payouts (
  id text PRIMARY KEY,
  creator_id text NOT NULL REFERENCES creator_profiles(id) ON DELETE RESTRICT,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency = 'USD'),
  state text NOT NULL CHECK (state IN (
    'REQUESTED','RISK_REVIEW','HELD','ELIGIBLE','SUBMITTED','IN_TRANSIT','PAID','FAILED','REVERSED','CANCELLED'
  )),
  provider_payout_id text,
  idempotency_key_hash text NOT NULL,
  requested_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1,
  UNIQUE (creator_id, idempotency_key_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS payouts_provider_id_uq
  ON payouts (provider_payout_id) WHERE provider_payout_id IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE creator_profiles
    ADD CONSTRAINT creator_profiles_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE checkout_reservations
    ADD CONSTRAINT checkout_reservations_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transaction_terms_snapshots
    ADD CONSTRAINT snapshots_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT
    DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transaction_terms_snapshots
    ADD CONSTRAINT snapshots_creator_fk
    FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_snapshot_fk
    FOREIGN KEY (snapshot_id) REFERENCES transaction_terms_snapshots(id) ON DELETE RESTRICT
    DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE payments
    ADD CONSTRAINT payments_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE guest_transaction_credentials
    ADD CONSTRAINT guest_creds_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE ledger_entries
    ADD CONSTRAINT ledger_entries_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reviews
    ADD CONSTRAINT reviews_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reviews
    ADD CONSTRAINT reviews_creator_fk
    FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE refunds
    ADD CONSTRAINT refunds_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE internal_disputes
    ADD CONSTRAINT disputes_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE checkout_sessions
    ADD CONSTRAINT checkout_sessions_tx_fk
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE checkout_sessions
    ADD CONSTRAINT checkout_sessions_res_fk
    FOREIGN KEY (reservation_id) REFERENCES checkout_reservations(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS payments_one_per_tx ON payments (transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS snapshots_one_per_tx ON transaction_terms_snapshots (transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS ledger_source_uq
  ON ledger_entries (accounting_rule_version, source_type, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_internal_dispute
  ON internal_disputes (transaction_id)
  WHERE state NOT IN ('BUYER_WON','CREATOR_WON','PARTIAL','WITHDRAWN','CLOSED');
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_id_uq
  ON payments (provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS refunds_provider_id_uq
  ON refunds (provider_refund_id) WHERE provider_refund_id IS NOT NULL;

ALTER TABLE transaction_terms_snapshots
  ADD COLUMN IF NOT EXISTS buyer_protection_fee_minor bigint NOT NULL DEFAULT 0;

ALTER TABLE refunds
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION ledger_entry_balanced_at_commit() RETURNS trigger AS $$
DECLARE
  debit_sum bigint;
  credit_sum bigint;
BEGIN
  SELECT COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'DEBIT'), 0),
         COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'CREDIT'), 0)
    INTO debit_sum, credit_sum
    FROM ledger_postings WHERE entry_id = NEW.id;
  IF debit_sum = 0 AND credit_sum = 0 THEN
    RAISE EXCEPTION 'ledger entry % has no postings', NEW.id;
  END IF;
  IF debit_sum <> credit_sum THEN
    RAISE EXCEPTION 'ledger entry % is unbalanced debit=% credit=%', NEW.id, debit_sum, credit_sum;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_entry_balanced_commit ON ledger_entries;
CREATE CONSTRAINT TRIGGER ledger_entry_balanced_commit
AFTER INSERT ON ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION ledger_entry_balanced_at_commit();

CREATE OR REPLACE FUNCTION deny_financial_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'append-only table % rejects %', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_append_only ON audit_events;
CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION deny_financial_mutation();

DROP TRIGGER IF EXISTS ledger_entries_append_only ON ledger_entries;
CREATE TRIGGER ledger_entries_append_only
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION deny_financial_mutation();

DROP TRIGGER IF EXISTS ledger_postings_append_only ON ledger_postings;
CREATE TRIGGER ledger_postings_append_only
BEFORE UPDATE OR DELETE ON ledger_postings
FOR EACH ROW EXECUTE FUNCTION deny_financial_mutation();

INSERT INTO schema_migrations(version, applied_at)
VALUES ('0004_auth_financial_integrity', now())
ON CONFLICT (version) DO NOTHING;
