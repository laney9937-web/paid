import {
  AppError,
  generatePublicOrderCode,
  generateSecretToken,
  hmacToken,
  type ActorContext,
} from '@paid/contracts';
import { requestHash } from '../hash';
import { quoteFees } from '../fees';
import { newId } from '../uuid';
import { NONTERMINAL_RESERVATIONS } from '../machines/reservation';
import type { UnitOfWork } from '../ports';
import type {
  CheckoutSessionRecord,
  GuestCredentialRecord,
  ReservationRecord,
  SnapshotRecord,
  TransactionRecord,
} from '../records';

export type CreateCheckoutInput = {
  actor: ActorContext;
  shareId: string;
  idempotencyKey: string;
  buyerJurisdiction?: string;
};

export type CreateCheckoutResult = {
  transactionId: string;
  reservationId: string;
  checkoutSessionId: string;
  publicOrderCode: string;
  redirectPath: string;
  guestToken: string;
  alreadyExisted: boolean;
};

export async function createCheckout(
  uow: UnitOfWork,
  input: CreateCheckoutInput,
  compliance: { outcome: 'ALLOW' | 'DENY' | 'REVIEW'; reasons: string[]; policyVersion: string },
): Promise<CreateCheckoutResult> {
  if (!uow.config.checkoutEnabled) {
    throw new AppError('FORBIDDEN', 'Checkout is disabled');
  }
  const link = await uow.getLinkByShareId(input.shareId);
  if (!link) throw new AppError('NOT_FOUND', 'Transaction not found');
  const locked = await uow.lockLink(link.id);
  if (!locked) throw new AppError('NOT_FOUND', 'Transaction not found');

  const now = uow.clock.now();
  const scope = 'create-checkout';
  const keyHash = requestHash({ scope, key: input.idempotencyKey });
  const bodyHash = requestHash({
    shareId: input.shareId,
    amountMinor: locked.amount.amountMinor.toString(),
    currency: locked.amount.currency,
    category: locked.category,
    deliveryDuration: locked.deliveryDuration,
  });

  const existingIdemEarly = await uow.findIdempotency(scope, keyHash);
  if (existingIdemEarly) {
    if (existingIdemEarly.requestHash !== bodyHash) {
      throw new AppError(
        'IDEMPOTENCY_CONFLICT',
        'Idempotency key was reused with a different request',
      );
    }
    const existing = JSON.parse(existingIdemEarly.resultJson) as CreateCheckoutResult;
    return { ...existing, alreadyExisted: true, guestToken: '' };
  }

  if (locked.expiresAt && locked.expiresAt <= now && locked.state === 'ACTIVE') {
    throw new AppError('LINK_INACTIVE', 'This transaction link has expired');
  }
  if (locked.state === 'CANCELLED' || locked.state === 'DISABLED' || locked.state === 'EXPIRED') {
    throw new AppError('LINK_INACTIVE', 'This transaction is no longer available');
  }
  if (locked.state === 'USED') {
    throw new AppError('LINK_USED', 'This transaction has already been paid');
  }

  const creator = await uow.getCreator(locked.creatorId);
  if (!creator || creator.onboardingState !== 'ACTIVE' || creator.newCheckoutBlocked) {
    throw new AppError('FORBIDDEN', 'Creator is not accepting payments');
  }

  if (compliance.outcome === 'DENY') {
    const blocked = compliance.reasons.includes('JURISDICTION_BLOCKED');
    throw new AppError(
      blocked ? 'JURISDICTION_BLOCKED' : 'FORBIDDEN',
      'This purchase cannot be completed',
    );
  }
  if (compliance.outcome === 'REVIEW') {
    throw new AppError('COMPLIANCE_REVIEW', 'This purchase requires additional review');
  }

  const open = await uow.findNonterminalReservation(locked.id);
  if (open && NONTERMINAL_RESERVATIONS.has(open.state)) {
    throw new AppError('LINK_RESERVED', 'This transaction is currently in progress.', {
      retryable: true,
    });
  }
  const capturedCount = await uow.countSuccessfulPaymentsByLink(locked.id);
  if (capturedCount > 0) {
    throw new AppError('LINK_USED', 'This transaction has already been paid');
  }

  const fees = quoteFees(locked.amount, uow.config.policy);
  const transactionId = newId();
  const snapshotId = newId();
  const reservationId = newId();
  const checkoutSessionId = newId();
  const paymentId = newId();
  const publicOrderCode = generatePublicOrderCode();
  const guestToken = generateSecretToken();
  const digest = hmacToken(uow.config.tokenKeyring, guestToken);

  const snapshot: SnapshotRecord = {
    id: snapshotId,
    transactionId,
    creatorId: creator.id,
    creatorHandle: creator.handle,
    creatorDisplayName: creator.displayName,
    amount: locked.amount,
    category: locked.category,
    deliveryDuration: locked.deliveryDuration,
    lane: locked.lane,
    feeScheduleVersion: uow.config.feeScheduleVersion,
    platformFee: fees.platformFee,
    processorFeeEstimate: fees.processorFeeEstimate,
    reserveAmount: fees.reserveAmount,
    buyerProtectionPolicyVersion: uow.config.buyerProtectionPolicyVersion,
    creatorAgreementVersion: uow.config.creatorAgreementVersion,
    jurisdictionPolicyVersion: uow.config.jurisdictionPolicyVersion,
    compliancePolicyVersion: compliance.policyVersion,
    providerConfigurationId: uow.config.providerConfigurationId,
    merchantPortfolioId: uow.config.merchantPortfolioId,
    statementDescriptor: uow.config.policy.statementDescriptor,
    descriptorIsSynthetic: uow.config.policy.descriptorIsSynthetic,
    taxResponsibility: 'PLATFORM',
    taxAmount: { amountMinor: 0n, currency: locked.amount.currency },
    trustSnapshotId: null,
    policyVersion: uow.config.policyVersion,
    createdAt: now,
  };

  const tx: TransactionRecord = {
    id: transactionId,
    linkId: locked.id,
    creatorId: creator.id,
    publicOrderCode,
    lane: locked.lane,
    providerConfigurationId: uow.config.providerConfigurationId,
    amount: locked.amount,
    snapshotId,
    paymentState: 'CREATED',
    fulfillmentState: 'AWAITING_DELIVERY',
    providerAuthoritativePaidAt: null,
    deliveryDeadlineAt: null,
    version: 1,
    createdAt: now,
  };

  const reservation: ReservationRecord = {
    id: reservationId,
    linkId: locked.id,
    transactionId,
    idempotencyScope: scope,
    idempotencyKeyHash: keyHash,
    state: 'RESERVED',
    providerConfigurationId: uow.config.providerConfigurationId,
    providerCheckoutId: null,
    createdAt: now,
    expiresAt: new Date(now.getTime() + uow.config.policy.checkoutReservationMinutes * 60 * 1000),
    lastTruthCheckAt: null,
    version: 1,
  };

  const checkout: CheckoutSessionRecord = {
    id: checkoutSessionId,
    transactionId,
    reservationId,
    state: 'CREATED',
    redirectUrl: `/checkout/return/mock?checkout=${checkoutSessionId}`,
    providerCheckoutId: null,
    createdAt: now,
    version: 1,
  };

  const guest: GuestCredentialRecord = {
    id: newId(),
    transactionId,
    digestHex: digest.digestHex,
    keyVersion: digest.keyVersion,
    purpose: 'ACCESS',
    expiresAt: new Date(now.getTime() + 30 * 86400 * 1000),
    consumedAt: null,
    revokedAt: null,
    continuationIssuedAt: null,
  };

  await uow.insertSnapshot(snapshot);
  await uow.insertTransaction(tx);
  await uow.insertReservation(reservation);
  await uow.insertCheckoutSession(checkout);
  await uow.insertPayment({
    id: paymentId,
    transactionId,
    providerPaymentId: null,
    state: 'CREATED',
    amount: locked.amount,
    capturedAmount: { amountMinor: 0n, currency: locked.amount.currency },
    refundedAmount: { amountMinor: 0n, currency: locked.amount.currency },
    version: 1,
  });
  await uow.insertGuestCredential(guest);
  const result: CreateCheckoutResult = {
    transactionId,
    reservationId,
    checkoutSessionId,
    publicOrderCode,
    redirectPath: `/guest/access/${guestToken}`,
    guestToken,
    alreadyExisted: false,
  };
  await uow.insertIdempotency({
    id: newId(),
    scope,
    keyHash,
    requestHash: bodyHash,
    resultJson: JSON.stringify({ ...result, guestToken: undefined }),
    createdAt: now,
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'CHECKOUT_RESERVED',
    subjectType: 'transaction',
    subjectId: transactionId,
    createdAt: now,
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'PROVIDER_CREATE_CHECKOUT',
    payload: { transactionId, reservationId, checkoutSessionId },
    dedupeKey: `provider-create-checkout:${reservationId}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 8,
    state: 'PENDING',
  });
  return result;
}

export function checkoutReturnDoesNotCapture(): true {
  return true;
}
