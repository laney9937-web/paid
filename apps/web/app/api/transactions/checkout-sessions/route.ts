import { NextResponse } from 'next/server';
import { checkoutBodySchema, errorEnvelope, isAppError, successEnvelope } from '@paid/contracts';
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
    const parsed = checkoutBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        errorEnvelope('VALIDATION_FAILED', 'Checkout body is invalid', false, requestId),
        { status: 400 },
      );
    }
    const shareId = parsed.data.shareId;
    const config = loadConfig();
    const buyerJurisdiction =
      config.SIMULATOR_ENABLED && config.PAID_BUILD_MODE === 'PROVIDER_AGNOSTIC' ? 'US' : 'UNKNOWN';
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
