import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError, successEnvelope } from '@paid/contracts';
import { decideCheckout } from '@paid/compliance';
import { createCheckout } from '@paid/domain';
import { loadConfig, takeRateLimit } from '@paid/config';
import { withStore } from '../../../../src/server/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  if (!takeRateLimit(`checkout:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      errorEnvelope('RATE_LIMITED', 'Too many checkout attempts', true, requestId),
      {
        status: 429,
      },
    );
  }
  try {
    const idempotencyKey = request.headers.get('idempotency-key');
    if (!idempotencyKey || idempotencyKey.trim().length < 8) {
      return NextResponse.json(
        errorEnvelope('VALIDATION_FAILED', 'Idempotency-Key header is required', false, requestId),
        { status: 400 },
      );
    }
    const raw = (await request.json()) as { shareId?: string; buyerJurisdiction?: string };
    const shareId = typeof raw.shareId === 'string' ? raw.shareId.trim() : '';
    const buyerJurisdiction =
      typeof raw.buyerJurisdiction === 'string' ? raw.buyerJurisdiction.trim() : undefined;
    if (shareId.length < 8 || shareId.length > 128) {
      return NextResponse.json(
        errorEnvelope('VALIDATION_FAILED', 'shareId required', false, requestId),
        { status: 400 },
      );
    }
    if (buyerJurisdiction && (buyerJurisdiction.length < 2 || buyerJurisdiction.length > 16)) {
      return NextResponse.json(
        errorEnvelope('VALIDATION_FAILED', 'buyerJurisdiction is invalid', false, requestId),
        { status: 400 },
      );
    }
    const config = loadConfig();
    const result = await withStore(async (uow) => {
      const link = await uow.getLinkByShareId(shareId);
      if (!link) {
        throw Object.assign(new Error('not-found'), { code: 'NOT_FOUND' });
      }
      const creator = await uow.getCreator(link.creatorId);
      const decision = decideCheckout({
        buildMode: config.PAID_BUILD_MODE,
        creatorOnboardingState: creator?.onboardingState ?? 'UNKNOWN',
        identityState: creator?.identityState ?? 'UNKNOWN',
        ageState: creator?.ageState ?? 'UNKNOWN',
        sanctionsState: creator?.sanctionsState ?? 'UNKNOWN',
        creatorJurisdiction: creator?.jurisdiction ?? 'UNKNOWN',
        buyerJurisdiction,
        requireKnownBuyerJurisdiction: config.JURISDICTION_REQUIRE_BUYER,
        allowlist: config.jurisdictionAllowlist,
        lane: link.lane,
        adultLaneEnabled: config.ADULT_LANE_ENABLED,
        checkoutEnabled: config.CHECKOUT_ENABLED,
        ticketMinor: link.amount.amountMinor,
        minTicketMinor: BigInt(uow.config.policy.minTicketMinor),
        maxTicketMinor: BigInt(uow.config.policy.maxTicketMinor),
        requiredStatesKnown: Boolean(creator && creator.identityState !== 'UNKNOWN'),
      });
      return createCheckout(
        uow,
        {
          actor: { actorType: 'PUBLIC', authStrength: 'NONE', requestId },
          shareId,
          idempotencyKey,
          buyerJurisdiction,
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
