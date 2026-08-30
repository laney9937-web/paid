# Bible §44 sibling-defect search

Searched 2026-08-29 against the shipped tree.

| Pattern | Result | Regression |
|---|---|---|
| Shared cache leak | Private routes set no-store in next.config; curl showed no-store on /c/maya | tests/security + launch headers |
| Frontend-only field hiding | DTOs constructed as allowlists; assertNoCreatorLeak | authorization/dtos.ts |
| Order code as auth | Receipt requires guest cookie; denyOrderCodeAuth | create-checkout.test + security |
| Bearer token plaintext/URL after exchange | HMAC digest stored; POST issues hashed SESSION cookie | guest-token.ts; continue/route.ts |
| Magic-link token discarded after hash | continueUrl only in EMAIL_MAGIC_LINK outbox; HTTP ack has no token | tests/magic-link-http.test.ts |
| Unauthenticated creator home leak | home uses session.creatorId; empty sign-in state | tests/e2e/magic-link.spec.ts |
| Redirect as payment success | Return page copy + capture only from signed mock webhook, never publicOrderCode | complete-payment/route.ts |
| GET mutation of guest ACCESS token | peekGuestToken is a pure read | guest-token.ts; guest-checkout e2e |
| Mutation 303 via Referer | assertAppPath same-app paths only | tests/security.test.ts |
| Duplicate webhook | Inbox unique + capture no-op if already CAPTURED | simulator duplicate-webhook |
| number/float money | money() rejects non-integers | money.test.ts |
| Mutable balance | projections from journal | projectCreatorBalances |
| Reserve as revenue | separate account codes | ledger test |
| Current fee vs snapshot | snapshot recorded at checkout | SnapshotRecord |
| Trust bypassing risk | evaluatePayoutRisk ignores publicTrustTier | risk/src |
| Payout dest without cooldown | DESTINATION_COOLDOWN < 48h | risk/src |
| Self review | submitReview forbids creatorId match | review.ts |
| Adult unapproved wallet | no Apple/Google Pay UI | transaction page |
| Arbitrary URL fetch | no fetch of user URLs | security test |
| Session replay analytics | none added | code search |
| Support KYC | DTO/staff copy | ops pages |
| Missing agreement version | snapshot creatorAgreementVersion | create-checkout |
| Migration deleting history | SQL additive 0001_init + 0002_auth_outbox | migrations.test |
| Silent recon overwrite | breaks as records | reconciliation package |
| Unknown event ignored | ALERT_UNKNOWN_PROVIDER_EVENT | simulator |
| No webhook size limit | 64k in webhook route | route.ts |
| Unicode lookalike handles | reserved via unique handle; future homograph | follow-up |
| Recovery weakening payout | recovery cooldown reason | risk |
| Secrets in fixtures | paid.example only | seed.ts |
| Generic dashboard theme | CSS modules/tokens | packages/ui |
