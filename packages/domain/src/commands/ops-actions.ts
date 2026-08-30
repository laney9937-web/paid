import { AppError, type ActorContext } from '@paid/contracts';
import { requestHash } from '../hash';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';

function requireOps(
  actor: ActorContext,
  roles: Array<'RISK' | 'PAYMENTS' | 'COMPLIANCE' | 'SECURITY'>,
) {
  if (actor.actorType !== 'OPS') throw new AppError('UNAUTHENTICATED', 'Staff session required');
  if (!roles.some((role) => actor.opsRoles?.includes(role))) {
    throw new AppError('FORBIDDEN', 'Not allowed');
  }
  if (actor.authStrength !== 'STEP_UP' && actor.authStrength !== 'PASSKEY') {
    throw new AppError('STEP_UP_REQUIRED', 'Fresh authentication is required');
  }
}

function requireReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length < 3 || trimmed.length > 200) {
    throw new AppError('VALIDATION_FAILED', 'Reason code is required');
  }
  return trimmed;
}

async function consumeIdempotency(
  uow: UnitOfWork,
  scope: string,
  key: string,
  body: Record<string, string>,
): Promise<{ hit: true; result: string } | { hit: false; keyHash: string; bodyHash: string }> {
  if (!key || key.trim().length < 8) {
    throw new AppError('VALIDATION_FAILED', 'Idempotency key is required');
  }
  const keyHash = requestHash({ scope, key });
  const bodyHash = requestHash(body);
  const existing = await uow.findIdempotency(scope, keyHash);
  if (existing) {
    if (existing.requestHash !== bodyHash) {
      throw new AppError(
        'IDEMPOTENCY_CONFLICT',
        'Idempotency key was reused with a different request',
      );
    }
    return { hit: true, result: existing.resultJson };
  }
  return { hit: false, keyHash, bodyHash };
}

export async function placePayoutHold(
  uow: UnitOfWork,
  input: { actor: ActorContext; creatorId: string; reason: string; idempotencyKey: string },
): Promise<{ alreadyExisted: boolean }> {
  requireOps(input.actor, ['RISK', 'PAYMENTS']);
  const reason = requireReason(input.reason);
  const scope = `payout-hold:${input.creatorId}`;
  const idem = await consumeIdempotency(uow, scope, input.idempotencyKey, {
    creatorId: input.creatorId,
    reason,
  });
  if (idem.hit) return { alreadyExisted: true };
  const creator = await uow.getCreator(input.creatorId);
  if (!creator) throw new AppError('NOT_FOUND', 'Creator not found');
  await uow.updateCreator({ ...creator, payoutHold: true, version: creator.version + 1 });
  const now = uow.clock.now();
  await uow.insertIdempotency({
    id: newId(),
    scope,
    keyHash: idem.keyHash,
    requestHash: idem.bodyHash,
    resultJson: JSON.stringify({ creatorId: creator.id }),
    createdAt: now,
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'PAYOUT_HOLD',
    subjectType: 'creator',
    subjectId: creator.id,
    afterDigest: reason,
    createdAt: now,
  });
  return { alreadyExisted: false };
}

export async function restrictCreatorCheckout(
  uow: UnitOfWork,
  input: { actor: ActorContext; creatorId: string; reason: string; idempotencyKey: string },
): Promise<{ alreadyExisted: boolean }> {
  requireOps(input.actor, ['COMPLIANCE']);
  const reason = requireReason(input.reason);
  const scope = `restrict-checkout:${input.creatorId}`;
  const idem = await consumeIdempotency(uow, scope, input.idempotencyKey, {
    creatorId: input.creatorId,
    reason,
  });
  if (idem.hit) return { alreadyExisted: true };
  const creator = await uow.getCreator(input.creatorId);
  if (!creator) throw new AppError('NOT_FOUND', 'Creator not found');
  await uow.updateCreator({
    ...creator,
    newCheckoutBlocked: true,
    version: creator.version + 1,
  });
  const now = uow.clock.now();
  await uow.insertIdempotency({
    id: newId(),
    scope,
    keyHash: idem.keyHash,
    requestHash: idem.bodyHash,
    resultJson: JSON.stringify({ creatorId: creator.id }),
    createdAt: now,
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'CHECKOUT_RESTRICTED',
    subjectType: 'creator',
    subjectId: creator.id,
    afterDigest: reason,
    createdAt: now,
  });
  return { alreadyExisted: false };
}
