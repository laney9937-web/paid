import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SQL migrations', () => {
  const sql = readFileSync(
    new URL('../packages/db/src/migrations/0001_init.sql', import.meta.url),
    'utf8',
  );

  it('enforces one nonterminal reservation and one captured transaction per link', () => {
    expect(sql).toContain('one_nonterminal_reservation_per_link');
    expect(sql).toContain("WHERE state IN ('RESERVED', 'PROVIDER_CREATED', 'RECONCILIATION_HOLD')");
    expect(sql).toContain('one_captured_transaction_per_link');
    expect(sql).toContain("WHERE payment_state = 'CAPTURED'");
  });

  it('stores money as bigint USD-only and balances ledger amounts', () => {
    expect(sql).toContain("currency text NOT NULL CHECK (currency = 'USD')");
    expect(sql).toContain('amount_minor bigint');
    expect(sql).toContain('ledger_entry_must_balance');
  });

  it('hashes guest credentials and unique provider events', () => {
    expect(sql).toContain('digest_hex text NOT NULL UNIQUE');
    expect(sql).toContain('UNIQUE (provider, provider_event_id)');
  });

  it('adds hashed auth tokens and outbox side-effect column', () => {
    const sql2 = readFileSync(
      new URL('../packages/db/src/migrations/0002_auth_outbox.sql', import.meta.url),
      'utf8',
    );
    expect(sql2).toContain('auth_tokens');
    expect(sql2).toContain('side_effect_at');
  });

  it('adds session truth, envelopes, payouts, journal trigger and append-only', () => {
    const sql4 = readFileSync(
      new URL('../packages/db/src/migrations/0004_auth_financial_integrity.sql', import.meta.url),
      'utf8',
    );
    expect(sql4).toContain('staff_role_grants');
    expect(sql4).toContain('secret_envelopes');
    expect(sql4).toContain('CREATE TABLE IF NOT EXISTS payouts');
    expect(sql4).toContain('ledger_source_uq');
    expect(sql4).toContain('ledger_entry_balanced_commit');
    expect(sql4).toContain('audit_events_append_only');
  });

  it('adds staff_role as a schema fact', () => {
    const sql3 = readFileSync(
      new URL('../packages/db/src/migrations/0003_staff.sql', import.meta.url),
      'utf8',
    );
    expect(sql3).toContain('staff_role');
    expect(sql3).toContain('0003_staff');
  });
});
