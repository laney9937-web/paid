import { AppError, systemClock, type Clock, type Money } from '@paid/contracts';
import type {
  AuditRecord,
  CheckoutSessionRecord,
  CreatorRecord,
  DisputeRecord,
  DomainConfig,
  GuestCredentialRecord,
  IdempotencyRecord,
  InboxStore,
  LedgerEntryInput,
  LinkRecord,
  OutboxRecord,
  PaymentRecord,
  RefundRecord,
  ReservationRecord,
  ReviewRecord,
  SnapshotRecord,
  TransactionRecord,
  UnitOfWork,
} from '@paid/domain';
import { ACCOUNT, NONTERMINAL_RESERVATIONS, newId } from '@paid/domain';
import type { CanonicalProviderEvent } from '@paid/contracts';
import { getSql } from './client';
import { postgresDomainConfig } from './domain-config';

type Sql = {
  (
    strings: TemplateStringsArray,
    ...params: unknown[]
  ): Promise<unknown[]> & { json?(value: unknown): unknown };
  json: (value: unknown) => unknown;
};

function n(value: bigint): string {
  return value.toString();
}

function usd(amountMinor: unknown): Money {
  return { amountMinor: BigInt(String(amountMinor)), currency: 'USD' };
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function asDateOrNull(value: unknown): Date | null {
  if (value == null) return null;
  return asDate(value);
}

function mapCreator(row: Record<string, unknown>): CreatorRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    handle: String(row.handle),
    displayName: String(row.display_name),
    onboardingState: row.onboarding_state as CreatorRecord['onboardingState'],
    lane: row.lane as CreatorRecord['lane'],
    identityState: row.identity_state as CreatorRecord['identityState'],
    ageState: row.age_state as CreatorRecord['ageState'],
    sanctionsState: row.sanctions_state as CreatorRecord['sanctionsState'],
    jurisdiction: String(row.jurisdiction),
    memberSince: asDate(row.member_since),
    version: Number(row.version),
    restricted: Boolean(row.restricted),
    payoutHold: Boolean(row.payout_hold),
    newCheckoutBlocked: Boolean(row.new_checkout_blocked),
  };
}

function mapLink(row: Record<string, unknown>): LinkRecord {
  return {
    id: String(row.id),
    creatorId: String(row.creator_id),
    shareId: String(row.share_id),
    state: row.state as LinkRecord['state'],
    amount: usd(row.amount_minor),
    category: row.category as LinkRecord['category'],
    deliveryDuration: row.delivery_duration as LinkRecord['deliveryDuration'],
    lane: row.lane as LinkRecord['lane'],
    note: row.note == null ? null : String(row.note),
    termsHash: String(row.terms_hash),
    activatedAt: asDateOrNull(row.activated_at),
    expiresAt: asDateOrNull(row.expires_at),
    cancelledAt: asDateOrNull(row.cancelled_at),
    version: Number(row.version),
    createdAt: asDate(row.created_at),
  };
}

function mapReservation(row: Record<string, unknown>): ReservationRecord {
  return {
    id: String(row.id),
    linkId: String(row.link_id),
    transactionId: String(row.transaction_id),
    idempotencyScope: String(row.idempotency_scope),
    idempotencyKeyHash: String(row.idempotency_key_hash),
    state: row.state as ReservationRecord['state'],
    providerConfigurationId: String(row.provider_configuration_id),
    providerCheckoutId: row.provider_checkout_id == null ? null : String(row.provider_checkout_id),
    createdAt: asDate(row.created_at),
    expiresAt: asDate(row.expires_at),
    lastTruthCheckAt: asDateOrNull(row.last_truth_check_at),
    version: Number(row.version),
  };
}

function mapTx(row: Record<string, unknown>): TransactionRecord {
  return {
    id: String(row.id),
    linkId: String(row.link_id),
    creatorId: String(row.creator_id),
    publicOrderCode: String(row.public_order_code),
    lane: row.lane as TransactionRecord['lane'],
    providerConfigurationId: String(row.provider_configuration_id),
    amount: usd(row.amount_minor),
    snapshotId: String(row.snapshot_id),
    paymentState: row.payment_state as TransactionRecord['paymentState'],
    fulfillmentState: row.fulfillment_state as TransactionRecord['fulfillmentState'],
    providerAuthoritativePaidAt: asDateOrNull(row.provider_authoritative_paid_at),
    deliveryDeadlineAt: asDateOrNull(row.delivery_deadline_at),
    version: Number(row.version),
    createdAt: asDate(row.created_at),
  };
}

function mapSnapshot(row: Record<string, unknown>): SnapshotRecord {
  return {
    id: String(row.id),
    transactionId: String(row.transaction_id),
    creatorId: String(row.creator_id),
    creatorHandle: String(row.creator_handle),
    creatorDisplayName: String(row.creator_display_name),
    amount: usd(row.amount_minor),
    category: row.category as SnapshotRecord['category'],
    deliveryDuration: row.delivery_duration as SnapshotRecord['deliveryDuration'],
    lane: row.lane as SnapshotRecord['lane'],
    feeScheduleVersion: String(row.fee_schedule_version),
    platformFee: usd(row.platform_fee_minor),
    processorFeeEstimate: usd(row.processor_fee_estimate_minor),
    reserveAmount: usd(row.reserve_amount_minor),
    buyerProtectionPolicyVersion: String(row.buyer_protection_policy_version),
    creatorAgreementVersion: String(row.creator_agreement_version),
    jurisdictionPolicyVersion: String(row.jurisdiction_policy_version),
    compliancePolicyVersion: String(row.compliance_policy_version),
    providerConfigurationId: String(row.provider_configuration_id),
    merchantPortfolioId: String(row.merchant_portfolio_id),
    statementDescriptor: String(row.statement_descriptor),
    descriptorIsSynthetic: Boolean(row.descriptor_is_synthetic),
    taxResponsibility: row.tax_responsibility as SnapshotRecord['taxResponsibility'],
    taxAmount: usd(row.tax_amount_minor),
    trustSnapshotId: row.trust_snapshot_id == null ? null : String(row.trust_snapshot_id),
    policyVersion: String(row.policy_version),
    createdAt: asDate(row.created_at),
  };
}

function isUniqueViolation(error: unknown, name?: string): boolean {
  const err = error as { code?: string; constraint_name?: string; constraint?: string };
  if (err.code !== '23505') return false;
  if (!name) return true;
  return err.constraint_name === name || err.constraint === name;
}

export class PostgresInbox implements InboxStore {
  constructor(private readonly sql: Sql) {}

  async findByProviderEventId(provider: string, providerEventId: string) {
    const rows = await this.sql`
      SELECT provider_event_id, provider, signature_valid, processed_at, payload
      FROM provider_events_inbox
      WHERE provider = ${provider} AND provider_event_id = ${providerEventId}
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const payload = row.payload as CanonicalProviderEvent | null;
    return {
      providerEventId,
      provider,
      signatureValid: Boolean(row.signature_valid),
      processed: Boolean(row.processed_at),
      canonicalEventId: payload?.canonicalEventId,
    };
  }

  async insert(record: {
    providerEventId: string;
    provider: string;
    signatureValid: boolean;
    processed: boolean;
    canonicalEventId?: string;
    rawDigest: string;
    event: CanonicalProviderEvent;
  }) {
    try {
      await this.sql`
        INSERT INTO provider_events_inbox (
          id, provider, provider_event_id, key_version, raw_digest, signature_valid,
          event_type, schema_version, occurred_at, received_at, processed_at, outcome, payload
        ) VALUES (
          ${record.event.canonicalEventId},
          ${record.provider},
          ${record.providerEventId},
          ${record.event.verificationKeyVersion},
          ${record.rawDigest},
          ${record.signatureValid},
          ${record.event.eventType},
          ${record.event.schemaVersion},
          ${record.event.occurredAt},
          ${record.event.receivedAt},
          ${record.processed ? new Date() : null},
          ${record.processed ? 'APPLIED' : 'RECEIVED'},
          ${this.sql.json(record.event as never)}
        )
      `;
      return 'inserted' as const;
    } catch (error) {
      if (isUniqueViolation(error, 'provider_events_inbox_provider_provider_event_id_key')) {
        return 'duplicate' as const;
      }
      throw error;
    }
  }
}

export class PostgresUnitOfWork implements UnitOfWork {
  readonly inbox: PostgresInbox;

  constructor(
    private readonly sql: Sql,
    readonly clock: Clock,
    readonly config: DomainConfig,
  ) {
    this.inbox = new PostgresInbox(sql);
  }

  async getCreator(id: string) {
    const rows = await this.sql`SELECT * FROM creator_profiles WHERE id = ${id}`;
    return rows[0] ? mapCreator(rows[0] as Record<string, unknown>) : null;
  }
  async getCreatorByHandle(handle: string) {
    const rows = await this.sql`SELECT * FROM creator_profiles WHERE handle = ${handle}`;
    return rows[0] ? mapCreator(rows[0] as Record<string, unknown>) : null;
  }
  async updateCreator(creator: CreatorRecord) {
    await this.sql`
      UPDATE creator_profiles SET
        handle = ${creator.handle},
        display_name = ${creator.displayName},
        onboarding_state = ${creator.onboardingState},
        lane = ${creator.lane},
        identity_state = ${creator.identityState},
        age_state = ${creator.ageState},
        sanctions_state = ${creator.sanctionsState},
        jurisdiction = ${creator.jurisdiction},
        restricted = ${creator.restricted},
        payout_hold = ${creator.payoutHold},
        new_checkout_blocked = ${creator.newCheckoutBlocked},
        updated_at = ${this.clock.now()},
        version = ${creator.version}
      WHERE id = ${creator.id}
    `;
  }

  async lockLink(id: string) {
    const rows = await this.sql`SELECT * FROM transaction_links WHERE id = ${id} FOR UPDATE`;
    return rows[0] ? mapLink(rows[0] as Record<string, unknown>) : null;
  }
  async getLinkByShareId(shareId: string) {
    const rows = await this.sql`SELECT * FROM transaction_links WHERE share_id = ${shareId}`;
    return rows[0] ? mapLink(rows[0] as Record<string, unknown>) : null;
  }
  async listLinksByCreator(creatorId: string) {
    const rows = await this.sql`
      SELECT * FROM transaction_links WHERE creator_id = ${creatorId} ORDER BY created_at DESC
    `;
    return rows.map((row) => mapLink(row as Record<string, unknown>));
  }
  async insertLink(link: LinkRecord) {
    await this.sql`
      INSERT INTO transaction_links (
        id, creator_id, share_id, state, amount_minor, currency, category, delivery_duration,
        lane, note, terms_hash, activated_at, expires_at, cancelled_at, created_at, updated_at, version
      ) VALUES (
        ${link.id}, ${link.creatorId}, ${link.shareId}, ${link.state}, ${n(link.amount.amountMinor)},
        ${link.amount.currency}, ${link.category}, ${link.deliveryDuration}, ${link.lane},
        ${link.note}, ${link.termsHash}, ${link.activatedAt}, ${link.expiresAt}, ${link.cancelledAt},
        ${link.createdAt}, ${link.createdAt}, ${link.version}
      )
    `;
  }
  async updateLink(link: LinkRecord) {
    await this.sql`
      UPDATE transaction_links SET
        state = ${link.state},
        cancelled_at = ${link.cancelledAt},
        activated_at = ${link.activatedAt},
        expires_at = ${link.expiresAt},
        updated_at = ${this.clock.now()},
        version = ${link.version}
      WHERE id = ${link.id}
    `;
  }

  async findNonterminalReservation(linkId: string) {
    const states = [...NONTERMINAL_RESERVATIONS];
    const rows = await this.sql`
      SELECT * FROM checkout_reservations
      WHERE link_id = ${linkId} AND state = ANY(${states})
      LIMIT 1
    `;
    return rows[0] ? mapReservation(rows[0] as Record<string, unknown>) : null;
  }
  async getReservation(id: string) {
    const rows = await this.sql`SELECT * FROM checkout_reservations WHERE id = ${id}`;
    return rows[0] ? mapReservation(rows[0] as Record<string, unknown>) : null;
  }
  async getReservationByIdempotency(scope: string, keyHash: string) {
    const rows = await this.sql`
      SELECT * FROM checkout_reservations
      WHERE idempotency_scope = ${scope} AND idempotency_key_hash = ${keyHash}
    `;
    return rows[0] ? mapReservation(rows[0] as Record<string, unknown>) : null;
  }
  async insertReservation(reservation: ReservationRecord) {
    try {
      await this.sql`
        INSERT INTO checkout_reservations (
          id, link_id, transaction_id, idempotency_scope, idempotency_key_hash, state,
          provider_configuration_id, provider_checkout_id, created_at, expires_at,
          last_truth_check_at, updated_at, version
        ) VALUES (
          ${reservation.id}, ${reservation.linkId}, ${reservation.transactionId},
          ${reservation.idempotencyScope}, ${reservation.idempotencyKeyHash}, ${reservation.state},
          ${reservation.providerConfigurationId}, ${reservation.providerCheckoutId},
          ${reservation.createdAt}, ${reservation.expiresAt}, ${reservation.lastTruthCheckAt},
          ${reservation.createdAt}, ${reservation.version}
        )
      `;
    } catch (error) {
      if (isUniqueViolation(error, 'one_nonterminal_reservation_per_link')) {
        throw new AppError('LINK_RESERVED', 'This transaction is currently in progress.', {
          retryable: true,
        });
      }
      throw error;
    }
  }
  async updateReservation(reservation: ReservationRecord) {
    await this.sql`
      UPDATE checkout_reservations SET
        state = ${reservation.state},
        provider_checkout_id = ${reservation.providerCheckoutId},
        last_truth_check_at = ${reservation.lastTruthCheckAt},
        updated_at = ${this.clock.now()},
        version = ${reservation.version}
      WHERE id = ${reservation.id}
    `;
  }
  async getReservationByTransaction(transactionId: string) {
    const rows = await this.sql`
      SELECT * FROM checkout_reservations WHERE transaction_id = ${transactionId}
    `;
    return rows[0] ? mapReservation(rows[0] as Record<string, unknown>) : null;
  }

  async findIdempotency(scope: string, keyHash: string) {
    const rows = await this.sql`
      SELECT * FROM idempotency_records WHERE scope = ${scope} AND key_hash = ${keyHash}
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      scope: String(row.scope),
      keyHash: String(row.key_hash),
      requestHash: String(row.request_hash),
      resultJson: String(row.result_json),
      createdAt: asDate(row.created_at),
    } satisfies IdempotencyRecord;
  }
  async insertIdempotency(record: IdempotencyRecord) {
    await this.sql`
      INSERT INTO idempotency_records (id, scope, key_hash, request_hash, result_json, created_at)
      VALUES (${record.id}, ${record.scope}, ${record.keyHash}, ${record.requestHash}, ${record.resultJson}, ${record.createdAt})
    `;
  }

  async insertSnapshot(snapshot: SnapshotRecord) {
    await this.sql`
      INSERT INTO transaction_terms_snapshots (
        id, transaction_id, creator_id, creator_handle, creator_display_name, amount_minor, currency,
        category, delivery_duration, lane, fee_schedule_version, platform_fee_minor,
        processor_fee_estimate_minor, reserve_amount_minor, buyer_protection_policy_version,
        creator_agreement_version, jurisdiction_policy_version, compliance_policy_version,
        provider_configuration_id, merchant_portfolio_id, statement_descriptor, descriptor_is_synthetic,
        tax_responsibility, tax_amount_minor, trust_snapshot_id, policy_version, created_at
      ) VALUES (
        ${snapshot.id}, ${snapshot.transactionId}, ${snapshot.creatorId}, ${snapshot.creatorHandle},
        ${snapshot.creatorDisplayName}, ${n(snapshot.amount.amountMinor)}, ${snapshot.amount.currency},
        ${snapshot.category}, ${snapshot.deliveryDuration}, ${snapshot.lane}, ${snapshot.feeScheduleVersion},
        ${n(snapshot.platformFee.amountMinor)}, ${n(snapshot.processorFeeEstimate.amountMinor)},
        ${n(snapshot.reserveAmount.amountMinor)}, ${snapshot.buyerProtectionPolicyVersion},
        ${snapshot.creatorAgreementVersion}, ${snapshot.jurisdictionPolicyVersion},
        ${snapshot.compliancePolicyVersion}, ${snapshot.providerConfigurationId},
        ${snapshot.merchantPortfolioId}, ${snapshot.statementDescriptor}, ${snapshot.descriptorIsSynthetic},
        ${snapshot.taxResponsibility}, ${n(snapshot.taxAmount.amountMinor)}, ${snapshot.trustSnapshotId},
        ${snapshot.policyVersion}, ${snapshot.createdAt}
      )
    `;
  }
  async getSnapshot(id: string) {
    const rows = await this.sql`SELECT * FROM transaction_terms_snapshots WHERE id = ${id}`;
    return rows[0] ? mapSnapshot(rows[0] as Record<string, unknown>) : null;
  }

  async insertTransaction(tx: TransactionRecord) {
    await this.sql`
      INSERT INTO transactions (
        id, link_id, creator_id, public_order_code, lane, provider_configuration_id,
        amount_minor, currency, snapshot_id, payment_state, fulfillment_state,
        provider_authoritative_paid_at, delivery_deadline_at, created_at, updated_at, version
      ) VALUES (
        ${tx.id}, ${tx.linkId}, ${tx.creatorId}, ${tx.publicOrderCode}, ${tx.lane},
        ${tx.providerConfigurationId}, ${n(tx.amount.amountMinor)}, ${tx.amount.currency},
        ${tx.snapshotId}, ${tx.paymentState}, ${tx.fulfillmentState},
        ${tx.providerAuthoritativePaidAt}, ${tx.deliveryDeadlineAt}, ${tx.createdAt}, ${tx.createdAt},
        ${tx.version}
      )
    `;
  }
  async getTransaction(id: string) {
    const rows = await this.sql`SELECT * FROM transactions WHERE id = ${id}`;
    return rows[0] ? mapTx(rows[0] as Record<string, unknown>) : null;
  }
  async getTransactionByOrderCode(code: string) {
    const rows = await this.sql`SELECT * FROM transactions WHERE public_order_code = ${code}`;
    return rows[0] ? mapTx(rows[0] as Record<string, unknown>) : null;
  }
  async getTransactionByLink(linkId: string) {
    const rows = await this.sql`
      SELECT * FROM transactions WHERE link_id = ${linkId} ORDER BY created_at DESC LIMIT 1
    `;
    return rows[0] ? mapTx(rows[0] as Record<string, unknown>) : null;
  }
  async updateTransaction(tx: TransactionRecord) {
    await this.sql`
      UPDATE transactions SET
        payment_state = ${tx.paymentState},
        fulfillment_state = ${tx.fulfillmentState},
        provider_authoritative_paid_at = ${tx.providerAuthoritativePaidAt},
        delivery_deadline_at = ${tx.deliveryDeadlineAt},
        updated_at = ${this.clock.now()},
        version = ${tx.version}
      WHERE id = ${tx.id}
    `;
  }
  async listTransactionsByCreator(creatorId: string) {
    const rows = await this.sql`
      SELECT * FROM transactions WHERE creator_id = ${creatorId} ORDER BY created_at DESC
    `;
    return rows.map((row) => mapTx(row as Record<string, unknown>));
  }

  async insertCheckoutSession(session: CheckoutSessionRecord) {
    await this.sql`
      INSERT INTO checkout_sessions (
        id, transaction_id, reservation_id, state, redirect_url, provider_checkout_id,
        created_at, updated_at, version
      ) VALUES (
        ${session.id}, ${session.transactionId}, ${session.reservationId}, ${session.state},
        ${session.redirectUrl}, ${session.providerCheckoutId}, ${session.createdAt},
        ${session.createdAt}, ${session.version}
      )
    `;
  }
  async getCheckoutSession(id: string) {
    const rows = await this.sql`SELECT * FROM checkout_sessions WHERE id = ${id}`;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      transactionId: String(row.transaction_id),
      reservationId: String(row.reservation_id),
      state: row.state as CheckoutSessionRecord['state'],
      redirectUrl: row.redirect_url == null ? null : String(row.redirect_url),
      providerCheckoutId:
        row.provider_checkout_id == null ? null : String(row.provider_checkout_id),
      createdAt: asDate(row.created_at),
      version: Number(row.version),
    } satisfies CheckoutSessionRecord;
  }
  async updateCheckoutSession(session: CheckoutSessionRecord) {
    await this.sql`
      UPDATE checkout_sessions SET
        state = ${session.state},
        redirect_url = ${session.redirectUrl},
        provider_checkout_id = ${session.providerCheckoutId},
        updated_at = ${this.clock.now()},
        version = ${session.version}
      WHERE id = ${session.id}
    `;
  }

  async insertPayment(payment: PaymentRecord) {
    await this.sql`
      INSERT INTO payments (
        id, transaction_id, provider_payment_id, state, amount_minor, currency,
        captured_minor, refunded_minor, created_at, updated_at, version
      ) VALUES (
        ${payment.id}, ${payment.transactionId}, ${payment.providerPaymentId}, ${payment.state},
        ${n(payment.amount.amountMinor)}, ${payment.amount.currency}, ${n(payment.capturedAmount.amountMinor)},
        ${n(payment.refundedAmount.amountMinor)}, ${this.clock.now()}, ${this.clock.now()}, ${payment.version}
      )
    `;
  }
  async getPaymentByTransaction(transactionId: string) {
    const rows = await this.sql`SELECT * FROM payments WHERE transaction_id = ${transactionId}`;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      transactionId: String(row.transaction_id),
      providerPaymentId: row.provider_payment_id == null ? null : String(row.provider_payment_id),
      state: row.state as PaymentRecord['state'],
      amount: usd(row.amount_minor),
      capturedAmount: usd(row.captured_minor),
      refundedAmount: usd(row.refunded_minor),
      version: Number(row.version),
    } satisfies PaymentRecord;
  }
  async updatePayment(payment: PaymentRecord) {
    await this.sql`
      UPDATE payments SET
        provider_payment_id = ${payment.providerPaymentId},
        state = ${payment.state},
        captured_minor = ${n(payment.capturedAmount.amountMinor)},
        refunded_minor = ${n(payment.refundedAmount.amountMinor)},
        updated_at = ${this.clock.now()},
        version = ${payment.version}
      WHERE id = ${payment.id}
    `;
  }

  async insertGuestCredential(credential: GuestCredentialRecord) {
    await this.sql`
      INSERT INTO guest_transaction_credentials (
        id, transaction_id, digest_hex, key_version, purpose, expires_at,
        consumed_at, revoked_at, continuation_issued_at, created_at
      ) VALUES (
        ${credential.id}, ${credential.transactionId}, ${credential.digestHex}, ${credential.keyVersion},
        ${credential.purpose}, ${credential.expiresAt}, ${credential.consumedAt}, ${credential.revokedAt},
        ${credential.continuationIssuedAt}, ${this.clock.now()}
      )
    `;
  }
  async findGuestCredentialByDigests(digests: string[]) {
    if (digests.length === 0) return null;
    const rows = await this.sql`
      SELECT * FROM guest_transaction_credentials WHERE digest_hex = ANY(${digests})
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      transactionId: String(row.transaction_id),
      digestHex: String(row.digest_hex),
      keyVersion: String(row.key_version),
      purpose: row.purpose as GuestCredentialRecord['purpose'],
      expiresAt: asDate(row.expires_at),
      consumedAt: asDateOrNull(row.consumed_at),
      revokedAt: asDateOrNull(row.revoked_at),
      continuationIssuedAt: asDateOrNull(row.continuation_issued_at),
    } satisfies GuestCredentialRecord;
  }
  async updateGuestCredential(credential: GuestCredentialRecord) {
    await this.sql`
      UPDATE guest_transaction_credentials SET
        consumed_at = ${credential.consumedAt},
        revoked_at = ${credential.revokedAt},
        continuation_issued_at = ${credential.continuationIssuedAt}
      WHERE id = ${credential.id}
    `;
  }

  async insertAudit(event: AuditRecord) {
    await this.sql`
      INSERT INTO audit_events (
        id, actor_json, action, subject_type, subject_id, before_digest, after_digest, reason, created_at
      ) VALUES (
        ${event.id}, ${this.sql.json(event.actor as never)}, ${event.action}, ${event.subjectType},
        ${event.subjectId}, ${event.beforeDigest ?? null}, ${event.afterDigest ?? null},
        ${event.reason ?? null}, ${event.createdAt}
      )
    `;
  }
  async insertOutbox(job: OutboxRecord) {
    await this.sql`
      INSERT INTO outbox_jobs (
        id, type, payload, dedupe_key, available_at, attempt_count, max_attempts, state, created_at
      ) VALUES (
        ${job.id}, ${job.type}, ${this.sql.json(job.payload as never)}, ${job.dedupeKey},
        ${job.availableAt}, ${job.attemptCount}, ${job.maxAttempts}, ${job.state}, ${this.clock.now()}
      )
      ON CONFLICT (dedupe_key) DO NOTHING
    `;
  }
  async appendJournal(entry: LedgerEntryInput) {
    let debit = 0n;
    let credit = 0n;
    for (const line of entry.lines) {
      if (line.direction === 'DEBIT') debit += line.amount.amountMinor;
      else credit += line.amount.amountMinor;
    }
    if (debit !== credit) {
      throw new AppError('INTERNAL_ERROR', 'Unbalanced journal');
    }
    await this.sql`
      INSERT INTO ledger_entries (
        id, source_type, source_id, transaction_id, currency, accounting_rule_version, occurred_at, recorded_at
      ) VALUES (
        ${entry.id}, ${entry.sourceType}, ${entry.sourceId}, ${entry.transactionId ?? null},
        ${entry.currency}, ${entry.accountingRuleVersion}, ${entry.occurredAt}, ${this.clock.now()}
      )
    `;
    for (const line of entry.lines) {
      await this.sql`
        INSERT INTO ledger_postings (
          id, entry_id, account_code, direction, amount_minor, currency, creator_id
        ) VALUES (
          ${newId()}, ${entry.id}, ${line.accountCode}, ${line.direction},
          ${n(line.amount.amountMinor)}, ${line.amount.currency}, ${line.creatorId ?? null}
        )
      `;
    }
  }

  async insertDispute(dispute: DisputeRecord) {
    await this.sql`
      INSERT INTO internal_disputes (
        id, transaction_id, state, opened_by, reason_code, created_at, updated_at, version
      ) VALUES (
        ${dispute.id}, ${dispute.transactionId}, ${dispute.state}, ${dispute.openedBy},
        ${dispute.reasonCode}, ${dispute.createdAt}, ${dispute.createdAt}, ${dispute.version}
      )
    `;
  }
  async getDisputeByTransaction(transactionId: string) {
    const rows = await this
      .sql`SELECT * FROM internal_disputes WHERE transaction_id = ${transactionId}`;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      transactionId: String(row.transaction_id),
      state: row.state as DisputeRecord['state'],
      openedBy: row.opened_by as DisputeRecord['openedBy'],
      reasonCode: String(row.reason_code),
      createdAt: asDate(row.created_at),
      version: Number(row.version),
    } satisfies DisputeRecord;
  }
  async updateDispute(dispute: DisputeRecord) {
    await this.sql`
      UPDATE internal_disputes SET
        state = ${dispute.state}, updated_at = ${this.clock.now()}, version = ${dispute.version}
      WHERE id = ${dispute.id}
    `;
  }

  async insertRefund(refund: RefundRecord) {
    await this.sql`
      INSERT INTO refunds (id, transaction_id, amount_minor, currency, state, provider_refund_id, created_at)
      VALUES (
        ${refund.id}, ${refund.transactionId}, ${n(refund.amount.amountMinor)}, ${refund.amount.currency},
        ${refund.state}, ${refund.providerRefundId}, ${refund.createdAt}
      )
    `;
  }
  async listRefunds(transactionId: string) {
    const rows = await this.sql`SELECT * FROM refunds WHERE transaction_id = ${transactionId}`;
    return rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        transactionId: String(row.transaction_id),
        amount: usd(row.amount_minor),
        state: row.state as RefundRecord['state'],
        providerRefundId: row.provider_refund_id == null ? null : String(row.provider_refund_id),
        createdAt: asDate(row.created_at),
      } satisfies RefundRecord;
    });
  }
  async updateRefund(refund: RefundRecord) {
    await this.sql`
      UPDATE refunds SET state = ${refund.state}, provider_refund_id = ${refund.providerRefundId}
      WHERE id = ${refund.id}
    `;
  }

  async insertReview(review: ReviewRecord) {
    try {
      await this.sql`
        INSERT INTO reviews (
          id, transaction_id, creator_id, state, rating, body, included_in_aggregate, created_at
        ) VALUES (
          ${review.id}, ${review.transactionId}, ${review.creatorId}, ${review.state},
          ${review.rating}, ${review.body}, ${review.includedInAggregate}, ${review.createdAt}
        )
      `;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError('STATE_CONFLICT', 'This transaction already has a review');
      }
      throw error;
    }
  }
  async getReviewByTransaction(transactionId: string) {
    const rows = await this.sql`SELECT * FROM reviews WHERE transaction_id = ${transactionId}`;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      transactionId: String(row.transaction_id),
      creatorId: String(row.creator_id),
      state: row.state as ReviewRecord['state'],
      rating: row.rating == null ? null : Number(row.rating),
      body: row.body == null ? null : String(row.body),
      includedInAggregate: Boolean(row.included_in_aggregate),
      createdAt: asDate(row.created_at),
    } satisfies ReviewRecord;
  }
  async updateReview(review: ReviewRecord) {
    await this.sql`
      UPDATE reviews SET
        state = ${review.state}, rating = ${review.rating}, body = ${review.body},
        included_in_aggregate = ${review.includedInAggregate}
      WHERE id = ${review.id}
    `;
  }

  async listReviewsByCreator(creatorId: string) {
    const rows = await this.sql`SELECT * FROM reviews WHERE creator_id = ${creatorId}`;
    return rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        transactionId: String(row.transaction_id),
        creatorId: String(row.creator_id),
        state: row.state as ReviewRecord['state'],
        rating: row.rating == null ? null : Number(row.rating),
        body: row.body == null ? null : String(row.body),
        includedInAggregate: Boolean(row.included_in_aggregate),
        createdAt: asDate(row.created_at),
      } satisfies ReviewRecord;
    });
  }
  async countCapturedByCreator(creatorId: string) {
    const rows = await this.sql`
      SELECT count(*)::int AS n FROM transactions
      WHERE creator_id = ${creatorId} AND payment_state = 'CAPTURED'
    `;
    return Number((rows[0] as { n: number }).n);
  }
  async listAuditsByAction(action: string) {
    const rows = await this.sql`
      SELECT * FROM audit_events WHERE action = ${action} ORDER BY created_at DESC LIMIT 50
    `;
    return rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        id: String(row.id),
        actor: row.actor_json as AuditRecord['actor'],
        action: String(row.action),
        subjectType: String(row.subject_type),
        subjectId: String(row.subject_id),
        beforeDigest: row.before_digest == null ? undefined : String(row.before_digest),
        afterDigest: row.after_digest == null ? undefined : String(row.after_digest),
        reason: row.reason == null ? undefined : String(row.reason),
        createdAt: asDate(row.created_at),
      } satisfies AuditRecord;
    });
  }

  async countSuccessfulPaymentsByLink(linkId: string) {
    const rows = await this.sql`
      SELECT count(*)::int AS n FROM transactions WHERE link_id = ${linkId} AND payment_state = 'CAPTURED'
    `;
    return Number((rows[0] as { n: number }).n);
  }
  async journalIsBalanced(entryId: string) {
    const rows = await this.sql`
      SELECT
        COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'DEBIT'), 0) AS debit,
        COALESCE(SUM(amount_minor) FILTER (WHERE direction = 'CREDIT'), 0) AS credit
      FROM ledger_postings WHERE entry_id = ${entryId}
    `;
    const row = rows[0] as { debit: string | number | bigint; credit: string | number | bigint };
    return (
      BigInt(String(row.debit)) === BigInt(String(row.credit)) && BigInt(String(row.debit)) > 0n
    );
  }
  async listJournalLines(entryId: string) {
    const rows = await this.sql`SELECT * FROM ledger_postings WHERE entry_id = ${entryId}`;
    return rows.map((raw) => {
      const row = raw as Record<string, unknown>;
      return {
        accountCode: String(row.account_code),
        direction: row.direction as 'DEBIT' | 'CREDIT',
        amount: usd(row.amount_minor),
        creatorId: row.creator_id == null ? undefined : String(row.creator_id),
      };
    });
  }
  async projectCreatorBalances(creatorId: string, asOf: Date) {
    const lines = await this.sql`
      SELECT p.account_code, p.direction, p.amount_minor, e.occurred_at
      FROM ledger_postings p
      JOIN ledger_entries e ON e.id = p.entry_id
      WHERE p.creator_id = ${creatorId} AND e.occurred_at <= ${asOf}
    `;
    let available = 0n;
    let reserved = 0n;
    let paid = 0n;
    for (const raw of lines) {
      const row = raw as Record<string, unknown>;
      const amount = BigInt(String(row.amount_minor));
      const signed = row.direction === 'CREDIT' ? amount : -amount;
      if (row.account_code === ACCOUNT.CREATOR_PAYABLE) available += signed;
      if (row.account_code === ACCOUNT.CREATOR_RESERVE) reserved += signed;
      if (row.account_code === ACCOUNT.PAYOUT_CLEARING && row.direction === 'CREDIT')
        paid += amount;
    }
    const pendingRows = await this.sql`
      SELECT COALESCE(SUM(amount_minor), 0) AS n FROM transactions
      WHERE creator_id = ${creatorId} AND payment_state <> 'CAPTURED'
    `;
    const pending = BigInt(String((pendingRows[0] as { n: string | number | bigint }).n));
    return {
      availableMinor: available,
      pendingMinor: pending,
      reservedMinor: reserved,
      paidMinor: paid,
    };
  }
}

export async function withPostgresUow<T>(
  fn: (uow: PostgresUnitOfWork) => Promise<T>,
  options?: { clock?: Clock; config?: DomainConfig },
): Promise<T> {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const uow = new PostgresUnitOfWork(
      tx as unknown as Sql,
      options?.clock ?? systemClock,
      options?.config ?? postgresDomainConfig(),
    );
    return fn(uow);
  }) as Promise<T>;
}
