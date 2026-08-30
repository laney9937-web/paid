import { AppError, FakeClock, type Clock } from '@paid/contracts';
import { MOCK_POLICY } from '@paid/config';
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
  PayoutRecord,
  RefundRecord,
  ReservationRecord,
  ReviewRecord,
  SecretEnvelopeRecord,
  SnapshotRecord,
  TransactionRecord,
  UnitOfWork,
} from '@paid/domain';
import { ACCOUNT, NONTERMINAL_RESERVATIONS, defaultRestrictedKeyring } from '@paid/domain';
import type { CanonicalProviderEvent, ProviderEventOutcome } from '@paid/contracts';

function occ(current: { version: number } | undefined, nextVersion: number): void {
  if (!current) throw new AppError('NOT_FOUND', 'Record not found');
  if (current.version !== nextVersion - 1) {
    throw new AppError('STATE_CONFLICT', 'This record was updated by another request');
  }
}

export function defaultDomainConfig(): DomainConfig {
  return {
    policy: MOCK_POLICY,
    feeScheduleVersion: 'fee.v2.mock',
    buyerProtectionPolicyVersion: 'protection.v1.mock',
    creatorAgreementVersion: 'agreement.v1.mock',
    jurisdictionPolicyVersion: 'jurisdiction.v1.mock',
    compliancePolicyVersion: 'compliance.v1.mock',
    providerConfigurationId: 'mock-provider-config',
    merchantPortfolioId: 'mock-portfolio-usd-digital',
    policyVersion: 'policy.v1.mock',
    trustAlgorithmVersion: 'trust.v1',
    tokenKeyring: { currentVersion: 'v1', keys: { v1: 'test-token-hmac-key-v1-32bytes-min' } },
    restrictedFieldKeyring: defaultRestrictedKeyring(),
    checkoutEnabled: true,
    newLinksEnabled: true,
    payoutEnabled: true,
    reviewEnabled: true,
    adultLaneEnabled: false,
    requireKnownBuyerJurisdiction: false,
  };
}

export function seedCreator(overrides: Partial<CreatorRecord> = {}): CreatorRecord {
  return {
    id: 'creator_maya',
    userId: 'user_maya',
    handle: 'maya',
    displayName: 'Maya',
    onboardingState: 'ACTIVE',
    lane: 'ORDINARY',
    identityState: 'VERIFIED',
    ageState: 'VERIFIED_ADULT',
    sanctionsState: 'CLEAR',
    jurisdiction: 'US-CA',
    memberSince: new Date('2026-01-01T00:00:00.000Z'),
    version: 1,
    restricted: false,
    payoutHold: false,
    newCheckoutBlocked: false,
    ...overrides,
  };
}

type JournalStored = LedgerEntryInput;

export class MemoryInbox implements InboxStore {
  readonly rows = new Map<
    string,
    { processed: boolean; event: CanonicalProviderEvent; outcome?: ProviderEventOutcome }
  >();

  async findByProviderEventId(provider: string, providerEventId: string) {
    const row = this.rows.get(`${provider}:${providerEventId}`);
    if (!row) return null;
    return {
      providerEventId,
      provider,
      signatureValid: true,
      processed: row.processed,
      canonicalEventId: row.event.canonicalEventId,
      outcome: row.outcome,
    };
  }

  async insert(record: {
    providerEventId: string;
    provider: string;
    processed: boolean;
    event: CanonicalProviderEvent;
  }) {
    const key = `${record.provider}:${record.providerEventId}`;
    if (this.rows.has(key)) return 'duplicate' as const;
    this.rows.set(key, { processed: false, event: record.event });
    return 'inserted' as const;
  }

  async markOutcome(provider: string, providerEventId: string, outcome: ProviderEventOutcome) {
    const key = `${provider}:${providerEventId}`;
    const row = this.rows.get(key);
    if (row) {
      row.processed = true;
      row.outcome = outcome;
    }
  }
}

export class MemoryUnitOfWork implements UnitOfWork {
  readonly clock: Clock;
  readonly config: DomainConfig;
  readonly creators = new Map<string, CreatorRecord>();
  readonly links = new Map<string, LinkRecord>();
  readonly reservations = new Map<string, ReservationRecord>();
  readonly snapshots = new Map<string, SnapshotRecord>();
  readonly transactions = new Map<string, TransactionRecord>();
  readonly checkouts = new Map<string, CheckoutSessionRecord>();
  readonly payments = new Map<string, PaymentRecord>();
  readonly guests = new Map<string, GuestCredentialRecord>();
  readonly idempotency = new Map<string, IdempotencyRecord>();
  readonly audits: AuditRecord[] = [];
  readonly outbox: OutboxRecord[] = [];
  readonly journals: JournalStored[] = [];
  readonly disputes = new Map<string, DisputeRecord>();
  readonly refunds: RefundRecord[] = [];
  readonly payouts = new Map<string, PayoutRecord>();
  readonly envelopes = new Map<string, SecretEnvelopeRecord>();
  readonly reviews = new Map<string, ReviewRecord>();
  readonly linkLocks = new Map<string, Promise<void>>();

  constructor(options?: { clock?: Clock; config?: DomainConfig; creator?: CreatorRecord }) {
    this.clock = options?.clock ?? new FakeClock();
    this.config = options?.config ?? defaultDomainConfig();
    const creator = options?.creator ?? seedCreator();
    this.creators.set(creator.id, creator);
  }

  async getCreator(id: string) {
    return this.creators.get(id) ?? null;
  }
  async getCreatorByHandle(handle: string) {
    return [...this.creators.values()].find((c) => c.handle === handle) ?? null;
  }
  async updateCreator(creator: CreatorRecord) {
    occ(this.creators.get(creator.id), creator.version);
    this.creators.set(creator.id, { ...creator });
  }

  async lockLink(id: string) {
    const link = this.links.get(id);
    return link ? { ...link } : null;
  }
  async getLinkByShareId(shareId: string) {
    return [...this.links.values()].find((l) => l.shareId === shareId) ?? null;
  }
  async listLinksByCreator(creatorId: string) {
    return [...this.links.values()].filter((l) => l.creatorId === creatorId);
  }
  async insertLink(link: LinkRecord) {
    this.links.set(link.id, { ...link });
  }
  async updateLink(link: LinkRecord) {
    occ(this.links.get(link.id), link.version);
    this.links.set(link.id, { ...link });
  }

  async findNonterminalReservation(linkId: string) {
    return (
      [...this.reservations.values()].find(
        (r) => r.linkId === linkId && NONTERMINAL_RESERVATIONS.has(r.state),
      ) ?? null
    );
  }
  async getReservation(id: string) {
    return this.reservations.get(id) ?? null;
  }
  async getReservationByIdempotency(scope: string, keyHash: string) {
    return (
      [...this.reservations.values()].find(
        (r) => r.idempotencyScope === scope && r.idempotencyKeyHash === keyHash,
      ) ?? null
    );
  }
  async insertReservation(reservation: ReservationRecord) {
    const open = await this.findNonterminalReservation(reservation.linkId);
    if (open) throw new AppError('LINK_RESERVED', 'This transaction is currently in progress.');
    this.reservations.set(reservation.id, { ...reservation });
  }
  async updateReservation(reservation: ReservationRecord) {
    occ(this.reservations.get(reservation.id), reservation.version);
    this.reservations.set(reservation.id, { ...reservation });
  }
  async getReservationByTransaction(transactionId: string) {
    return [...this.reservations.values()].find((r) => r.transactionId === transactionId) ?? null;
  }

  async findIdempotency(scope: string, keyHash: string) {
    return this.idempotency.get(`${scope}:${keyHash}`) ?? null;
  }
  async insertIdempotency(record: IdempotencyRecord) {
    this.idempotency.set(`${record.scope}:${record.keyHash}`, { ...record });
  }

  async insertSnapshot(snapshot: SnapshotRecord) {
    this.snapshots.set(snapshot.id, { ...snapshot });
  }
  async getSnapshot(id: string) {
    return this.snapshots.get(id) ?? null;
  }

  async insertTransaction(tx: TransactionRecord) {
    this.transactions.set(tx.id, { ...tx });
  }
  async getTransaction(id: string) {
    return this.transactions.get(id) ?? null;
  }
  async getTransactionByOrderCode(code: string) {
    return [...this.transactions.values()].find((t) => t.publicOrderCode === code) ?? null;
  }
  async getTransactionByLink(linkId: string) {
    return [...this.transactions.values()].find((t) => t.linkId === linkId) ?? null;
  }
  async updateTransaction(tx: TransactionRecord) {
    occ(this.transactions.get(tx.id), tx.version);
    this.transactions.set(tx.id, { ...tx });
  }
  async listTransactionsByCreator(creatorId: string) {
    return [...this.transactions.values()].filter((t) => t.creatorId === creatorId);
  }

  async insertCheckoutSession(session: CheckoutSessionRecord) {
    this.checkouts.set(session.id, { ...session });
  }
  async getCheckoutSession(id: string) {
    return this.checkouts.get(id) ?? null;
  }
  async updateCheckoutSession(session: CheckoutSessionRecord) {
    occ(this.checkouts.get(session.id), session.version);
    this.checkouts.set(session.id, { ...session });
  }

  async insertPayment(payment: PaymentRecord) {
    this.payments.set(payment.id, { ...payment });
  }
  async getPaymentByTransaction(transactionId: string) {
    return [...this.payments.values()].find((p) => p.transactionId === transactionId) ?? null;
  }
  async updatePayment(payment: PaymentRecord) {
    occ(this.payments.get(payment.id), payment.version);
    this.payments.set(payment.id, { ...payment });
  }

  async insertGuestCredential(credential: GuestCredentialRecord) {
    this.guests.set(credential.id, { ...credential });
  }
  async findGuestCredentialByDigests(digests: string[]) {
    const set = new Set(digests);
    return [...this.guests.values()].find((g) => set.has(g.digestHex)) ?? null;
  }
  async updateGuestCredential(credential: GuestCredentialRecord) {
    this.guests.set(credential.id, { ...credential });
  }

  async insertAudit(event: AuditRecord) {
    this.audits.push(event);
  }
  async insertOutbox(job: OutboxRecord) {
    if (this.outbox.some((j) => j.dedupeKey === job.dedupeKey && j.state !== 'DEAD_LETTER')) {
      return;
    }
    this.outbox.push(job);
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
    if (
      this.journals.some(
        (row) =>
          row.accountingRuleVersion === entry.accountingRuleVersion &&
          row.sourceType === entry.sourceType &&
          row.sourceId === entry.sourceId,
      )
    ) {
      throw new AppError('STATE_CONFLICT', 'Duplicate ledger source');
    }
    this.journals.push(entry);
  }

  async insertDispute(dispute: DisputeRecord) {
    this.disputes.set(dispute.transactionId, { ...dispute });
  }
  async getDisputeByTransaction(transactionId: string) {
    return this.disputes.get(transactionId) ?? null;
  }
  async updateDispute(dispute: DisputeRecord) {
    occ(this.disputes.get(dispute.transactionId), dispute.version);
    this.disputes.set(dispute.transactionId, { ...dispute });
  }

  async insertRefund(refund: RefundRecord) {
    this.refunds.push({ ...refund });
  }
  async getRefund(id: string) {
    return this.refunds.find((r) => r.id === id) ?? null;
  }
  async listRefunds(transactionId: string) {
    return this.refunds.filter((r) => r.transactionId === transactionId);
  }
  async updateRefund(refund: RefundRecord) {
    const idx = this.refunds.findIndex((r) => r.id === refund.id);
    if (idx < 0) throw new AppError('NOT_FOUND', 'Refund not found');
    occ(this.refunds[idx], refund.version);
    this.refunds[idx] = refund;
  }

  async insertPayout(payout: PayoutRecord) {
    this.payouts.set(payout.id, { ...payout });
  }
  async getPayout(id: string) {
    return this.payouts.get(id) ?? null;
  }
  async getPayoutByIdempotency(creatorId: string, keyHash: string) {
    return (
      [...this.payouts.values()].find(
        (row) => row.creatorId === creatorId && row.idempotencyKeyHash === keyHash,
      ) ?? null
    );
  }
  async listPayoutsByCreator(creatorId: string) {
    return [...this.payouts.values()].filter((row) => row.creatorId === creatorId);
  }
  async updatePayout(payout: PayoutRecord) {
    occ(this.payouts.get(payout.id), payout.version);
    this.payouts.set(payout.id, { ...payout });
  }

  async insertSecretEnvelope(envelope: SecretEnvelopeRecord) {
    const nonceKey = envelope.nonce.toString('hex');
    for (const existing of this.envelopes.values()) {
      if (
        existing.keyVersion === envelope.keyVersion &&
        existing.nonce.toString('hex') === nonceKey
      ) {
        throw new AppError('INTERNAL_ERROR', 'Secret envelope nonce reused');
      }
    }
    this.envelopes.set(envelope.id, { ...envelope });
  }
  async getSecretEnvelope(id: string) {
    return this.envelopes.get(id) ?? null;
  }
  async findSecretEnvelopeByCredential(credentialId: string) {
    return [...this.envelopes.values()].find((row) => row.credentialId === credentialId) ?? null;
  }
  async updateSecretEnvelope(envelope: SecretEnvelopeRecord) {
    this.envelopes.set(envelope.id, { ...envelope });
  }

  async insertReview(review: ReviewRecord) {
    if (this.reviews.has(review.transactionId)) {
      throw new AppError('STATE_CONFLICT', 'This transaction already has a review');
    }
    this.reviews.set(review.transactionId, review);
  }
  async getReviewByTransaction(transactionId: string) {
    return this.reviews.get(transactionId) ?? null;
  }
  async updateReview(review: ReviewRecord) {
    this.reviews.set(review.transactionId, review);
  }

  async listReviewsByCreator(creatorId: string) {
    return [...this.reviews.values()].filter((r) => r.creatorId === creatorId);
  }
  async countCapturedByCreator(creatorId: string) {
    return [...this.transactions.values()].filter(
      (t) => t.creatorId === creatorId && t.paymentState === 'CAPTURED',
    ).length;
  }
  async listAuditsByAction(action: string) {
    return this.audits.filter((a) => a.action === action);
  }

  async countSuccessfulPaymentsByLink(linkId: string) {
    const txs = [...this.transactions.values()].filter((t) => t.linkId === linkId);
    return txs.filter((t) => t.paymentState === 'CAPTURED').length;
  }
  async journalIsBalanced(entryId: string) {
    const entry = this.journals.find((j) => j.id === entryId);
    if (!entry) return false;
    let debit = 0n;
    let credit = 0n;
    for (const line of entry.lines) {
      if (line.direction === 'DEBIT') debit += line.amount.amountMinor;
      else credit += line.amount.amountMinor;
    }
    return debit === credit;
  }
  async listJournalLines(entryId: string) {
    return this.journals.find((j) => j.id === entryId)?.lines ?? [];
  }
  async hasLedgerSource(sourceType: string, sourceId: string) {
    return this.journals.some((j) => j.sourceType === sourceType && j.sourceId === sourceId);
  }
  async projectCreatorBalances(creatorId: string, asOf: Date) {
    let available = 0n;
    let pending = 0n;
    let reserved = 0n;
    let inTransit = 0n;
    let paid = 0n;
    let negative = 0n;
    for (const journal of this.journals) {
      if (journal.occurredAt > asOf) continue;
      for (const line of journal.lines) {
        if (line.creatorId !== creatorId) continue;
        const signed =
          line.direction === 'CREDIT' ? line.amount.amountMinor : -line.amount.amountMinor;
        if (line.accountCode === ACCOUNT.CREATOR_PAYABLE) available += signed;
        if (line.accountCode === ACCOUNT.CREATOR_RESERVE) reserved += signed;
        if (line.accountCode === ACCOUNT.PAYOUT_IN_TRANSIT) inTransit += signed;
        if (line.accountCode === ACCOUNT.PAYOUT_CLEARING && line.direction === 'CREDIT')
          paid += line.amount.amountMinor;
        if (line.accountCode === ACCOUNT.CHARGEBACK_RECEIVABLE) negative += signed;
      }
    }
    for (const tx of this.transactions.values()) {
      if (
        tx.creatorId === creatorId &&
        (tx.paymentState === 'CREATED' || tx.paymentState === 'AUTHORIZED')
      ) {
        pending += tx.amount.amountMinor;
      }
    }
    return {
      availableMinor: available,
      pendingMinor: pending,
      reservedMinor: reserved,
      inTransitMinor: inTransit,
      paidMinor: paid,
      negativeMinor: negative,
    };
  }
}
