# Acceptance test results

Source catalog: `11_ACCEPTANCE_TEST_MATRIX.md`. Environment: local PROVIDER_AGNOSTIC unless noted.

| ID | Requirement | Test type | Test file/runbook | Environment | Result | Evidence path | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| A-01 | Two-buyer checkout race | unit+sql | packages/domain/src/commands/create-checkout.test.ts, tests/pg-constraints.test.ts | local | PASS | vitest | VERIFIED | ≤1 nonterminal reservation |
| A-02 | Idempotent create-checkout | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| A-03 | Idempotency conflict | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| A-04 | Immutable activated terms | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | cancel/recreate |
| A-05 | Cancel blocks new checkout | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| A-06 | Late capture after timeout | unit+sim | simulator late-success-after-timeout | local | PASS | mock:scenario | VERIFIED | |
| A-07 | Delivery deadline from paid time | unit | capturePaymentFromProvider | local | PASS | vitest | VERIFIED | |
| B-01 | Redirect is not capture | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| B-02 | Duplicate webhook | unit+sim | processCanonicalProviderEvent | local | PASS | mock:scenario | VERIFIED | |
| B-03 | Invalid signature | sim | invalid-signature | local | PASS | mock:scenario | VERIFIED | |
| B-04 | Unknown valid event | sim | unknown-valid-event | local | PASS | mock:scenario | VERIFIED | |
| B-05 | Descriptor synthetic | static+UI | checkout page copy | local | PASS | /c/maya + /t | VERIFIED | |
| C-01 | Balanced journals | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| C-02 | Reserve not revenue | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| C-03 | Partial refund cap | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| D-01 | Mark delivered idempotent | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| D-02 | Guest confirm authz | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| E-01 | One review per tx | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| E-02 | Trust thresholds | unit | packages/trust/src/trust.test.ts | local | PASS | vitest | VERIFIED | |
| F-01 | Public trust ≠ payout | unit | packages/risk | local | PASS | evaluatePayoutRisk ignores trust | VERIFIED | |
| G-01 | Creator isolation | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| G-02 | Order code not auth | unit | create-checkout.test.ts + security | local | PASS | vitest | VERIFIED | |
| G-03 | Scanner GET | unit+sim | peekGuestToken | local | PASS | mock:scenario | VERIFIED | |
| H-01 | no-store private | static+http | next.config.ts, curl /c/maya | local | PASS | launch-web.log | VERIFIED | |
| I-01 | Token HMAC hashed | unit | tokens.ts | local | PASS | vitest | VERIFIED | |
| J-01 | Outbox once | unit | processor.test.ts | local | PASS | vitest | VERIFIED | |
| K-01 | Core pages a11y | e2e | tests/e2e/core-pages.spec.ts | local chromium | PASS | playwright.log | VERIFIED | |
| L-01 | Fail-closed production mock | unit | fail-closed.test.ts | local | PASS | vitest | VERIFIED | |
| L-02 | Named simulator suite | contract | provider-simulator | local | PASS | integration-simulator.log | VERIFIED | |
