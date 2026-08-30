CREATE TABLE IF NOT EXISTS auth_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  email_digest text NOT NULL,
  digest_hex text NOT NULL UNIQUE,
  key_version text NOT NULL,
  purpose text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_uq ON sessions (token_hash);

ALTER TABLE outbox_jobs ADD COLUMN IF NOT EXISTS side_effect_at timestamptz;

INSERT INTO schema_migrations(version, applied_at)
VALUES ('0002_auth_outbox', now())
ON CONFLICT (version) DO NOTHING;
