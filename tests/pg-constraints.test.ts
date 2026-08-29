import postgres from 'postgres';
import { describe, expect, it } from 'vitest';

const url = process.env.DATABASE_URL ?? 'postgres://paid:paid_local_only@127.0.0.1:5432/paid';

describe('postgres constraints', () => {
  it('rejects non-USD currency on payments', async () => {
    const sql = postgres(url, { max: 1 });
    try {
      await expect(
        sql.unsafe(`INSERT INTO payments (
          id, transaction_id, state, amount_minor, currency, captured_minor, refunded_minor, created_at, updated_at
        ) VALUES ('p_eur', 't_eur', 'CAPTURED', 100, 'EUR', 100, 0, now(), now())`),
      ).rejects.toThrow();
    } finally {
      await sql.end();
    }
  });

  it('enforces one nonterminal reservation per link', async () => {
    const sql = postgres(url, { max: 1 });
    const suffix = `${Date.now()}`;
    try {
      await sql.unsafe(`
        INSERT INTO users (id, email, email_digest, created_at, updated_at)
        VALUES ('u_race_${suffix}', 'race${suffix}@paid.example', 'd_race_${suffix}', now(), now());
        INSERT INTO creator_profiles (
          id, user_id, handle, display_name, onboarding_state, lane,
          identity_state, age_state, sanctions_state, jurisdiction, member_since,
          restricted, payout_hold, new_checkout_blocked, created_at, updated_at
        ) VALUES (
          'c_race_${suffix}', 'u_race_${suffix}', 'race${suffix}', 'Race', 'ACTIVE', 'ORDINARY',
          'VERIFIED', 'VERIFIED_ADULT', 'CLEAR', 'US-CA', now(),
          false, false, false, now(), now()
        );
        INSERT INTO transaction_links (
          id, creator_id, share_id, state, amount_minor, currency, category,
          delivery_duration, lane, terms_hash, created_at, updated_at
        ) VALUES (
          'link_race_${suffix}', 'c_race_${suffix}', 'share_race_${suffix}', 'ACTIVE', 5000, 'USD',
          'DIGITAL_COMMISSION', 'PT48H', 'ORDINARY', 'hash', now(), now()
        );
        INSERT INTO checkout_reservations (
          id, link_id, transaction_id, idempotency_scope, idempotency_key_hash, state,
          provider_configuration_id, created_at, expires_at, updated_at
        ) VALUES (
          'res_a_${suffix}', 'link_race_${suffix}', 'tx_a_${suffix}', 'create-checkout', 'k1', 'RESERVED',
          'mock', now(), now() + interval '15 minutes', now()
        );
      `);
      await expect(
        sql.unsafe(`
          INSERT INTO checkout_reservations (
            id, link_id, transaction_id, idempotency_scope, idempotency_key_hash, state,
            provider_configuration_id, created_at, expires_at, updated_at
          ) VALUES (
            'res_b_${suffix}', 'link_race_${suffix}', 'tx_b_${suffix}', 'create-checkout', 'k2', 'RESERVED',
            'mock', now(), now() + interval '15 minutes', now()
          )
        `),
      ).rejects.toThrow();
    } finally {
      await sql.end();
    }
  });
});
