import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError, successEnvelope } from '@paid/contracts';
import { decideCheckout } from '@paid/compliance';
import { createCheckout } from '@paid/domain';
import { MOCK_POLICY } from '@paid/config';
import { withStore } from '../../../../src/server/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const body = (await request.json()) as { shareId?: string };
    const shareId = body.shareId;
    if (!shareId) {
      return NextResponse.json(
        errorEnvelope('VALIDATION_FAILED', 'shareId required', false, requestId),
        { status: 400 },
      );
    }
    const result = await withStore(async (uow) => {
      const link = await uow.getLinkByShareId(shareId);
      if (!link) {
        throw Object.assign(new Error('not-found'), { code: 'NOT_FOUND' });
      }
      const creator = await uow.getCreator(link.creatorId);
      const decision = decideCheckout({
        buildMode: 'PROVIDER_AGNOSTIC',
        creatorOnboardingState: creator?.onboardingState ?? 'UNKNOWN',
        identityState: creator?.identityState ?? 'UNKNOWN',
        ageState: creator?.ageState ?? 'UNKNOWN',
        sanctionsState: creator?.sanctionsState ?? 'UNKNOWN',
        creatorJurisdiction: creator?.jurisdiction ?? 'UNKNOWN',
        allowlist: ['US'],
        lane: link.lane,
        adultLaneEnabled: false,
        checkoutEnabled: true,
        ticketMinor: link.amount.amountMinor,
        minTicketMinor: BigInt(MOCK_POLICY.minTicketMinor),
        maxTicketMinor: BigInt(MOCK_POLICY.maxTicketMinor),
        requiredStatesKnown: Boolean(creator && creator.identityState !== 'UNKNOWN'),
      });
      return createCheckout(
        uow,
        {
          actor: { actorType: 'PUBLIC', authStrength: 'NONE', requestId },
          shareId,
          idempotencyKey: request.headers.get('idempotency-key') ?? crypto.randomUUID(),
        },
        decision,
      );
    });
    return NextResponse.json(
      successEnvelope(
        {
          redirectPath: result.redirectPath,
          publicOrderCode: result.publicOrderCode,
          transactionId: result.transactionId,
        },
        requestId,
      ),
    );
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        errorEnvelope(error.code, error.message, error.retryable, requestId),
        { status: error.httpStatus },
      );
    }
    if ((error as { code?: string }).code === 'NOT_FOUND') {
      return NextResponse.json(
        errorEnvelope('NOT_FOUND', 'Transaction not found', false, requestId),
        { status: 404 },
      );
    }
    return NextResponse.json(errorEnvelope('INTERNAL_ERROR', 'Unexpected error', true, requestId), {
      status: 500,
    });
  }
}
