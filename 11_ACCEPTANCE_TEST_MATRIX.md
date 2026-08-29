# 11 — Acceptance & Adversarial Test Matrix

Every row requires a unique scenario ID, test/evidence reference and final status in the implementation copy. This source catalog is normative; Grok must materialize it into `docs/evidence/acceptance-test-results.md` with the columns at the end.

## A. Link and immutable terms

- Two browsers race to create checkout for one link; at most one successful transaction can exist.
- Repeated `Create checkout` with same idempotency key returns the original session.
- Same idempotency key with changed body is rejected.
- Creator cannot edit amount/category/deadline after activation.
- Creator cancellation prevents new checkout but does not erase existing transaction evidence.
- Expired reservation unlocks safely when no provider payment exists.
- Provider success arriving after local reservation timeout is reconciled, not discarded.
- Public amount/creator/terms cannot be changed with URL/browser payload tampering.
- Delivery deadline is derived from canonical payment time.

## B. Payment/provider events

- Redirect without webhook/API proof never marks payment captured.
- Duplicate webhook creates one canonical event and one ledger posting.
- Out-of-order authorized/captured/refund events converge to provider-authoritative state.
- Unknown verified event is retained/dead-lettered and alerts operations.
- Invalid signature, stale timestamp and replay are rejected.
- Overlapping old/new webhook keys work only during configured rotation window.
- Provider outage returns stable retryable error without creating phantom transaction.
- Checkout return state prevents open redirect/session mix-up.
- Amount/currency/provider portfolio are server-controlled.
- Mock provider descriptor is synthetic and clearly not represented as live approval.
- Descriptor/provider/portfolio snapshot cannot drift after payment even if configuration changes.
- Checkout and receipt render the same approved or accurately qualified descriptor copy.

## C. Financial integrity

- Every journal entry balances by currency.
- Fees/reserves are not misclassified as revenue.
- Partial/full refund creates compensating postings; original history remains.
- Chargeback after payout creates correct negative/receivable state.
- Re-running financial command cannot double post.
- Dashboard available/pending/reserved/payout values equal ledger projections.
- Reconciliation catches missing capture, fee, refund, reserve and payout.
- Manual adjustment requires balanced posting, reason, actor and approval.
- Restore from backup followed by provider reconciliation reproduces explainable balances.

## D. Fulfillment, protection and disputes

- Creator can mark delivered once; retries are idempotent.
- Buyer confirmation requires correct guest/account authorization and state.
- Dispute cannot open outside configured eligibility/window.
- Internal dispute and network chargeback can coexist without double refund.
- Dispute financial resolution requires authorized staff and idempotency.
- Illegal/underage/non-consensual report bypasses commercial SLA into restricted case.
- IP/DMCA, legal/privacy, sanctions and transaction-laundering reports route to the correct restricted case type with evidence/access history.
- Unknown required sanctions, age, tax, jurisdiction or adult-lane policy state fails closed in live/sandbox modes and behaves deterministically in mock mode.
- No routine explicit-media upload surface exists.
- Historical transaction/policy snapshot is used in adjudication.

## E. Reviews and trust

- No eligible transaction -> no review.
- One transaction -> maximum one active canonical review.
- Creator cannot review self, access buyer identity or delete legitimate review.
- Refunded/disputed/fraud-invalidated review behavior follows versioned policy.
- Public rating thresholds prevent misleading tiny-sample percentages.
- Trust snapshot is deterministic and versioned.
- Private fraud/risk features never appear in public DTO/UI/analytics.
- Handle change preserves reputation continuity.
- Linked/self-purchase fixtures do not unlock public trust/payout solely through reviews.

## F. Payout risk and account security

- Payout destination change requires fresh step-up authentication.
- Destination change creates audit/security event, notification and payout hold.
- Account recovery invalidates/steps down sessions and payout eligibility.
- Public high trust cannot bypass private payout rules.
- Human override has reason, actor, expiry and immutable history.
- Global/provider/creator payout kill switches take effect server-side.
- No startup-financed instant payout path exists.

## G. Authorization and privacy

- Creator A cannot access Creator B's links, transactions, reviews, payouts or disputes.
- Creator responses never include buyer email, billing identity, risk/device data or secret token.
- Guest credential accesses exactly one transaction scope.
- Public order code alone grants no private access.
- Revoked/reissued guest token behaves correctly.
- Enumeration returns consistent not-found behavior.
- Admin roles enforce object, function and field-level permissions.
- Sensitive read/export actions are audited.
- Account deletion preserves required financial/legal records and anonymizes allowed fields.
- Legal hold prevents scheduled deletion.
- Data export and staff search cannot expose raw tax, sanctions, restricted identity or adult-transaction linkage outside approved roles.

## H. Browser/PWA/security headers

- Private/auth/API routes return no-store/private headers as specified.
- Secret tokens never appear in logs, analytics or referrer headers.
- Transaction/profile beta routes are noindex.
- Service worker never caches authenticated/private transaction/API responses.
- CSP blocks unapproved scripts/frames while selected provider sandbox still works.
- HSTS/nosniff/referrer/permissions policies are present in production build.
- No permissive wildcard CORS.
- No auth token in localStorage.
- XSS payloads in pseudonym/review/reference render inert.
- Arbitrary external URL cannot trigger server-side fetch/SSRF.

## I. Auth/recovery

- Passkey registration/authentication verifies challenge, origin, RP ID, signature and user verification.
- Challenge is one-time and expires.
- Session rotates after login/recovery/privilege elevation.
- Cookie attributes are correct.
- Magic-link/account-recovery responses resist account enumeration.
- Lost credential recovery cannot immediately change payout destination.
- Admin and customer sessions/cookies/origins are isolated.
- Concurrent logout/revocation invalidates sessions predictably.

## J. Outbox/jobs/email

- State transaction plus outbox insertion is atomic.
- Worker crash after side effect but before acknowledgement does not duplicate unsafe action.
- Retry uses bounded backoff/jitter and preserves dedupe key.
- Dead-letter item alerts and can be safely replayed.
- Email outage never rolls back a captured transaction.
- Email subjects/content are privacy-safe and creator never receives buyer private email.
- Invalid/bounced addresses are handled without leaking identity.
- Time-based jobs are idempotent across two worker instances.

## K. UI/UX/accessibility

- 320px, 390px and large-mobile layouts have no clipping/horizontal scroll.
- Dynamic data/skeleton transition causes no material layout shift.
- Mobile keyboard does not cover submit controls.
- Browser back/refresh preserves or safely reconstructs every non-secret state.
- Buttons have immediate pressed state and cannot double-submit.
- Errors preserve valid form input and provide an actionable next step.
- Keyboard-only navigation/focus order works.
- Screen-reader labels and announcements work for amount/status/error.
- 200% text zoom does not lose content/function.
- Reduced motion is respected.
- Creator/buyer flows contain no generic dashboard clutter or unexplained metrics.

## L. Reliability, operations and release

- App refuses production startup with mock provider/live-checkout mismatch.
- Payment, payout, adult-lane, jurisdiction and review kill switches are tested.
- Database PITR/backup restore procedure is exercised.
- Restore requires reconciliation before money operations resume.
- Processor outage runbook is executable.
- Reconciliation break creates case/alert and cannot be hidden by editing a balance.
- Metrics/logging continue without restricted data.
- External compliance decision changes are versioned, audited and cannot retroactively rewrite transaction snapshots.
- Dormant/failed payout state remains explainable and cannot be silently treated as platform revenue.
- Analytics failure does not block checkout.
- Migration tests cover fresh DB + previous supported schema.
- Rolling old/new app versions process provider events compatibly.
- SBOM, dependency scan, secrets scan and exact build manifest are produced.
- Release artifact maps to protected commit and migration version.

## Required evidence columns

For the final implementation, convert this document into a table with:

`ID | Requirement | Test type | Test file/runbook | Environment | Result | Evidence path | Status | Notes`

## Brand consistency and safe naming

- Customer-facing mock/build surfaces use `Paid` consistently.
- Domain examples use `paid.example`, never an owned third-party domain.
- Public copy does not claim trademark registration, escrow/bank status, absolute purchase guarantees, or legal clearance.
- Brand configuration can support a qualified store-metadata fallback without changing canonical product/domain entities.
