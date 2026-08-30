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
        INSERT INTO transaction_terms_snapshots (
          id, transaction_id, creator_id, creator_handle, creator_display_name, amount_minor, currency,
          category, delivery_duration, lane, fee_schedule_version, platform_fee_minor,
          processor_fee_estimate_minor, reserve_amount_minor, buyer_protection_policy_version,
          creator_agreement_version, jurisdiction_policy_version, compliance_policy_version,
          provider_configuration_id, merchant_portfolio_id, statement_descriptor, descriptor_is_synthetic,
          tax_responsibility, tax_amount_minor, policy_version, created_at
        ) VALUES (
          'snap_a_${suffix}', 'tx_a_${suffix}', 'c_race_${suffix}', 'race', 'Race', 5000, 'USD',
          'DIGITAL_COMMISSION', 'PT48H', 'ORDINARY', 'fee.v2.mock', 250, 175, 500, 'p',
          'a', 'j', 'c', 'mock', 'port', 'TRUST*CREATOR', true, 'PLATFORM', 0, 'policy.v1.mock', now()
        );
        INSERT INTO transactions (
          id, link_id, creator_id, public_order_code, lane, provider_configuration_id,
          amount_minor, currency, snapshot_id, payment_state, fulfillment_state, created_at, updated_at
        ) VALUES (
          'tx_a_${suffix}', 'link_race_${suffix}', 'c_race_${suffix}', 'ord_a_${suffix}', 'ORDINARY', 'mock',
          5000, 'USD', 'snap_a_${suffix}', 'CREATED', 'AWAITING_DELIVERY', now(), now()
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
          INSERT INTO transaction_terms_snapshots (
            id, transaction_id, creator_id, creator_handle, creator_display_name, amount_minor, currency,
            category, delivery_duration, lane, fee_schedule_version, platform_fee_minor,
            processor_fee_estimate_minor, reserve_amount_minor, buyer_protection_policy_version,
            creator_agreement_version, jurisdiction_policy_version, compliance_policy_version,
            provider_configuration_id, merchant_portfolio_id, statement_descriptor, descriptor_is_synthetic,
            tax_responsibility, tax_amount_minor, policy_version, created_at
          ) VALUES (
            'snap_b_${suffix}', 'tx_b_${suffix}', 'c_race_${suffix}', 'race', 'Race', 5000, 'USD',
            'DIGITAL_COMMISSION', 'PT48H', 'ORDINARY', 'fee.v2.mock', 250, 175, 500, 'p',
            'a', 'j', 'c', 'mock', 'port', 'TRUST*CREATOR', true, 'PLATFORM', 0, 'policy.v1.mock', now()
          );
          INSERT INTO transactions (
            id, link_id, creator_id, public_order_code, lane, provider_configuration_id,
            amount_minor, currency, snapshot_id, payment_state, fulfillment_state, created_at, updated_at
          ) VALUES (
            'tx_b_${suffix}', 'link_race_${suffix}', 'c_race_${suffix}', 'ord_b_${suffix}', 'ORDINARY', 'mock',
            5000, 'USD', 'snap_b_${suffix}', 'CREATED', 'AWAITING_DELIVERY', now(), now()
          );
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

  it('rejects unbalanced journals, append-only mutations, and orphan FKs', async () => {
    const sql = postgres(url, { max: 1 });
    const suffix = `${Date.now()}`;
    try {
      await expect(
        sql.unsafe(`
          INSERT INTO ledger_entries (
            id, source_type, source_id, currency, accounting_rule_version, occurred_at, recorded_at
          ) VALUES ('e_bad_${suffix}', 'TEST', 's_${suffix}', 'USD', 'ledger.v1', now(), now())
        `),
      ).rejects.toThrow();
      await sql.unsafe(`
        INSERT INTO audit_events (id, actor_json, action, subject_type, subject_id, created_at)
        VALUES ('a_${suffix}', '{"actorType":"WORKER","authStrength":"SERVICE","requestId":"req_audit_1"}'::jsonb,
                'TEST', 'system', 's_${suffix}', now())
      `);
      await expect(
        sql.unsafe(`UPDATE audit_events SET action = 'TAMPER' WHERE id = 'a_${suffix}'`),
      ).rejects.toThrow();
      await expect(
        sql.unsafe(`
          INSERT INTO payments (
            id, transaction_id, state, amount_minor, currency, captured_minor, refunded_minor, created_at, updated_at
          ) VALUES ('p_orphan_${suffix}', 'missing_tx_${suffix}', 'CREATED', 100, 'USD', 0, 0, now(), now())
        `),
      ).rejects.toThrow();
    } finally {
      await sql.end();
    }
  });
});
