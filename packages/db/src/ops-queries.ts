import { getSql } from './client';

export type OpsList<T> = { rows: T[]; total: number; page: number };

function pageOf(raw: string | undefined): number {
  const n = Number(raw ?? '1');
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export async function listOpsCreators(
  q = '',
  pageRaw?: string,
): Promise<OpsList<Record<string, string | boolean>>> {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const like = `%${q.replaceAll('%', '')}%`;
  const rows = await sql`
    SELECT id, handle, display_name, onboarding_state, payout_hold, jurisdiction
    FROM creator_profiles
    WHERE handle ILIKE ${like} OR display_name ILIKE ${like}
    ORDER BY handle
    LIMIT 25 OFFSET ${offset}
  `;
  const count = await sql`
    SELECT count(*)::int AS n FROM creator_profiles
    WHERE handle ILIKE ${like} OR display_name ILIKE ${like}
  `;
  return {
    page,
    total: Number((count[0] as { n: number }).n),
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        handle: String(row.handle),
        displayName: String(row.display_name),
        onboardingState: String(row.onboarding_state),
        payoutHold: Boolean(row.payout_hold),
        jurisdiction: String(row.jurisdiction),
      };
    }),
  };
}

export async function listOpsTransactions(q = '', pageRaw?: string) {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const like = `%${q.replaceAll('%', '')}%`;
  const rows = await sql`
    SELECT t.id, t.public_order_code, t.payment_state, t.fulfillment_state, t.amount_minor, c.handle
    FROM transactions t
    JOIN creator_profiles c ON c.id = t.creator_id
    WHERE t.public_order_code ILIKE ${like} OR c.handle ILIKE ${like}
    ORDER BY t.created_at DESC
    LIMIT 25 OFFSET ${offset}
  `;
  const count = await sql`
    SELECT count(*)::int AS n FROM transactions t
    JOIN creator_profiles c ON c.id = t.creator_id
    WHERE t.public_order_code ILIKE ${like} OR c.handle ILIKE ${like}
  `;
  return {
    page,
    total: Number((count[0] as { n: number }).n),
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        publicOrderCode: String(row.public_order_code),
        paymentState: String(row.payment_state),
        fulfillmentState: String(row.fulfillment_state),
        amountMinor: String(row.amount_minor),
        creatorHandle: String(row.handle),
      };
    }),
  };
}

export async function listOpsRefunds(pageRaw?: string) {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const rows = await sql`
    SELECT id, transaction_id, amount_minor, state, created_at FROM refunds
    ORDER BY created_at DESC LIMIT 25 OFFSET ${offset}
  `;
  const count = await sql`SELECT count(*)::int AS n FROM refunds`;
  return {
    page,
    total: Number((count[0] as { n: number }).n),
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        transactionId: String(row.transaction_id),
        amountMinor: String(row.amount_minor),
        state: String(row.state),
      };
    }),
  };
}

export async function listOpsPayouts(pageRaw?: string) {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const rows = await sql`
    SELECT p.id, p.creator_id, p.amount_minor, p.state, c.handle
    FROM payouts p JOIN creator_profiles c ON c.id = p.creator_id
    ORDER BY p.requested_at DESC LIMIT 25 OFFSET ${offset}
  `;
  const count = await sql`SELECT count(*)::int AS n FROM payouts`;
  return {
    page,
    total: Number((count[0] as { n: number }).n),
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        creatorId: String(row.creator_id),
        amountMinor: String(row.amount_minor),
        state: String(row.state),
        handle: String(row.handle),
      };
    }),
  };
}

export async function listOpsDisputes(pageRaw?: string) {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const rows = await sql`
    SELECT id, transaction_id, state, reason_code, opened_by FROM internal_disputes
    ORDER BY created_at DESC LIMIT 25 OFFSET ${offset}
  `;
  const count = await sql`SELECT count(*)::int AS n FROM internal_disputes`;
  return {
    page,
    total: Number((count[0] as { n: number }).n),
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        transactionId: String(row.transaction_id),
        state: String(row.state),
        reasonCode: String(row.reason_code),
        openedBy: String(row.opened_by),
      };
    }),
  };
}

export async function listOpsInbox(pageRaw?: string) {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const rows = await sql`
    SELECT provider, provider_event_id, event_type, outcome, processed_at
    FROM provider_events_inbox
    ORDER BY received_at DESC LIMIT 25 OFFSET ${offset}
  `;
  const count = await sql`SELECT count(*)::int AS n FROM provider_events_inbox`;
  return {
    page,
    total: Number((count[0] as { n: number }).n),
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        provider: String(row.provider),
        providerEventId: String(row.provider_event_id),
        eventType: String(row.event_type),
        outcome: row.outcome == null ? 'RECEIVED' : String(row.outcome),
        processed: Boolean(row.processed_at),
      };
    }),
  };
}

export async function listOpsOutbox(pageRaw?: string) {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const rows = await sql`
    SELECT id, type, state, attempt_count, last_error FROM outbox_jobs
    ORDER BY created_at DESC LIMIT 25 OFFSET ${offset}
  `;
  const count = await sql`SELECT count(*)::int AS n FROM outbox_jobs`;
  return {
    page,
    total: Number((count[0] as { n: number }).n),
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        type: String(row.type),
        state: String(row.state),
        attemptCount: Number(row.attempt_count),
        lastError: row.last_error == null ? '' : String(row.last_error),
      };
    }),
  };
}

export async function listOpsAudit(action = '', pageRaw?: string) {
  const sql = getSql();
  const page = pageOf(pageRaw);
  const offset = (page - 1) * 25;
  const rows = action
    ? await sql`
        SELECT id, action, subject_type, subject_id, actor_json, created_at
        FROM audit_events WHERE action = ${action}
        ORDER BY created_at DESC LIMIT 25 OFFSET ${offset}
      `
    : await sql`
        SELECT id, action, subject_type, subject_id, actor_json, created_at
        FROM audit_events
        ORDER BY created_at DESC LIMIT 25 OFFSET ${offset}
      `;
  return {
    page,
    total: rows.length,
    rows: rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      const actor = row.actor_json as {
        actorId?: string;
        opsRoles?: string[];
        authStrength?: string;
        sessionId?: string;
      };
      return {
        id: String(row.id),
        action: String(row.action),
        subjectType: String(row.subject_type),
        subjectId: String(row.subject_id),
        actorId: actor?.actorId ?? '',
        roles: (actor?.opsRoles ?? []).join(','),
        authStrength: actor?.authStrength ?? '',
        sessionId: actor?.sessionId ?? '',
      };
    }),
  };
}

export async function loadReconSnapshot() {
  const sql = getSql();
  const n = (row: { n?: number } | undefined) => Number(row?.n ?? 0);
  const captures =
    await sql`SELECT count(*)::int AS n FROM transactions WHERE payment_state = 'CAPTURED'`;
  const providerCaptures =
    await sql`SELECT count(*)::int AS n FROM provider_events_inbox WHERE event_type = 'PAYMENT_CAPTURED' AND outcome = 'APPLIED'`;
  const refunds = await sql`SELECT count(*)::int AS n FROM refunds WHERE state = 'SUCCEEDED'`;
  const providerRefunds =
    await sql`SELECT count(*)::int AS n FROM provider_events_inbox WHERE event_type = 'REFUND_SUCCEEDED' AND outcome = 'APPLIED'`;
  const payouts = await sql`SELECT count(*)::int AS n FROM payouts WHERE state = 'PAID'`;
  const providerPayouts =
    await sql`SELECT count(*)::int AS n FROM provider_events_inbox WHERE event_type = 'PAYOUT_PAID' AND outcome = 'APPLIED'`;
  return {
    internalCaptures: n(captures[0] as { n?: number } | undefined),
    providerCaptures: n(providerCaptures[0] as { n?: number } | undefined),
    internalRefunds: n(refunds[0] as { n?: number } | undefined),
    providerRefunds: n(providerRefunds[0] as { n?: number } | undefined),
    internalPayouts: n(payouts[0] as { n?: number } | undefined),
    providerPayouts: n(providerPayouts[0] as { n?: number } | undefined),
  };
}

export async function retryDeadLetter(jobId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE outbox_jobs
    SET state = 'PENDING', available_at = ${new Date()}, lease_until = null
    WHERE id = ${jobId} AND state = 'DEAD_LETTER'
  `;
}
