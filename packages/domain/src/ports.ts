import type { Clock, TokenKeyring } from '@paid/contracts';
import type { MOCK_POLICY } from '@paid/config';
import type {
  AuditRecord,
  CheckoutSessionRecord,
  CreatorRecord,
  DisputeRecord,
  GuestCredentialRecord,
  IdempotencyRecord,
  LedgerEntryInput,
  LinkRecord,
  OutboxRecord,
  PaymentRecord,
  RefundRecord,
  ReservationRecord,
  ReviewRecord,
  SnapshotRecord,
  TransactionRecord,
} from './records';

export type DomainConfig = {
  policy: typeof MOCK_POLICY;
  feeScheduleVersion: string;
  buyerProtectionPolicyVersion: string;
  creatorAgreementVersion: string;
  jurisdictionPolicyVersion: string;
  compliancePolicyVersion: string;
  providerConfigurationId: string;
  merchantPortfolioId: string;
  policyVersion: string;
  trustAlgorithmVersion: string;
  tokenKeyring: TokenKeyring;
  checkoutEnabled: boolean;
  newLinksEnabled: boolean;
  payoutEnabled: boolean;
  reviewEnabled: boolean;
  adultLaneEnabled: boolean;
};

export interface UnitOfWork {
  readonly clock: Clock;
  readonly config: DomainConfig;

  getCreator(id: string): Promise<CreatorRecord | null>;
  getCreatorByHandle(handle: string): Promise<CreatorRecord | null>;
  updateCreator(creator: CreatorRecord): Promise<void>;

  lockLink(id: string): Promise<LinkRecord | null>;
  getLinkByShareId(shareId: string): Promise<LinkRecord | null>;
  listLinksByCreator(creatorId: string): Promise<LinkRecord[]>;
  insertLink(link: LinkRecord): Promise<void>;
  updateLink(link: LinkRecord): Promise<void>;

  findNonterminalReservation(linkId: string): Promise<ReservationRecord | null>;
  getReservation(id: string): Promise<ReservationRecord | null>;
  getReservationByIdempotency(scope: string, keyHash: string): Promise<ReservationRecord | null>;
  insertReservation(reservation: ReservationRecord): Promise<void>;
  updateReservation(reservation: ReservationRecord): Promise<void>;
  getReservationByTransaction(transactionId: string): Promise<ReservationRecord | null>;

  findIdempotency(scope: string, keyHash: string): Promise<IdempotencyRecord | null>;
  insertIdempotency(record: IdempotencyRecord): Promise<void>;

  insertSnapshot(snapshot: SnapshotRecord): Promise<void>;
  getSnapshot(id: string): Promise<SnapshotRecord | null>;

  insertTransaction(tx: TransactionRecord): Promise<void>;
  getTransaction(id: string): Promise<TransactionRecord | null>;
  getTransactionByOrderCode(code: string): Promise<TransactionRecord | null>;
  getTransactionByLink(linkId: string): Promise<TransactionRecord | null>;
  updateTransaction(tx: TransactionRecord): Promise<void>;
  listTransactionsByCreator(creatorId: string): Promise<TransactionRecord[]>;

  insertCheckoutSession(session: CheckoutSessionRecord): Promise<void>;
  getCheckoutSession(id: string): Promise<CheckoutSessionRecord | null>;
  updateCheckoutSession(session: CheckoutSessionRecord): Promise<void>;

  insertPayment(payment: PaymentRecord): Promise<void>;
  getPaymentByTransaction(transactionId: string): Promise<PaymentRecord | null>;
  updatePayment(payment: PaymentRecord): Promise<void>;

  insertGuestCredential(credential: GuestCredentialRecord): Promise<void>;
  findGuestCredentialByDigests(digests: string[]): Promise<GuestCredentialRecord | null>;
  updateGuestCredential(credential: GuestCredentialRecord): Promise<void>;

  insertAudit(event: AuditRecord): Promise<void>;
  insertOutbox(job: OutboxRecord): Promise<void>;
  appendJournal(entry: LedgerEntryInput): Promise<void>;

  insertDispute(dispute: DisputeRecord): Promise<void>;
  getDisputeByTransaction(transactionId: string): Promise<DisputeRecord | null>;
  updateDispute(dispute: DisputeRecord): Promise<void>;

  insertRefund(refund: RefundRecord): Promise<void>;
  listRefunds(transactionId: string): Promise<RefundRecord[]>;
  updateRefund(refund: RefundRecord): Promise<void>;

  insertReview(review: ReviewRecord): Promise<void>;
  getReviewByTransaction(transactionId: string): Promise<ReviewRecord | null>;
  updateReview(review: ReviewRecord): Promise<void>;

  listReviewsByCreator(creatorId: string): Promise<ReviewRecord[]>;
  countCapturedByCreator(creatorId: string): Promise<number>;
  listAuditsByAction(action: string): Promise<AuditRecord[]>;

  countSuccessfulPaymentsByLink(linkId: string): Promise<number>;
  journalIsBalanced(entryId: string): Promise<boolean>;
  listJournalLines(entryId: string): Promise<LedgerEntryInput['lines']>;
  projectCreatorBalances(
    creatorId: string,
    asOf: Date,
  ): Promise<{
    availableMinor: bigint;
    pendingMinor: bigint;
    reservedMinor: bigint;
    paidMinor: bigint;
  }>;
}
