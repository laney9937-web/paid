# Acceptance test results

Source catalog: `11_ACCEPTANCE_TEST_MATRIX.md`. Environment: local `PROVIDER_AGNOSTIC` unless noted.

Status values: `VERIFIED` | `NOT_APPLICABLE` (with rationale) | `BLOCKED_EXTERNAL`.

| ID | Requirement | Test type | Test file/runbook | Environment | Result | Evidence path | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| A-01 | Two-buyer checkout race | unit+sql | packages/domain/src/commands/create-checkout.test.ts; tests/pg-constraints.test.ts | local | PASS | vitest | VERIFIED | ≤1 nonterminal reservation |
| A-02 | Idempotent create-checkout | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | same key returns original session |
| A-03 | Idempotency conflict | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | same key, different body |
| A-04 | Immutable activated terms | unit | create-checkout.test.ts; tests/acceptance-matrix.test.ts A-04 | local | PASS | vitest | VERIFIED | cancel/expire do not rewrite amount |
| A-05 | Cancel blocks new checkout | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | LINK_INACTIVE; evidence retained |
| A-06 | Expired reservation unlocks safely | unit | tests/acceptance-matrix.test.ts A-06 | local | PASS | vitest | VERIFIED | requires provider proof of no payment |
| A-07 | Late capture after timeout | unit+sim | create-checkout.test.ts; simulator late-success-after-timeout | local | PASS | vitest + mock:scenario | VERIFIED | payment becomes CAPTURED |
| A-08 | Tampering cannot change amount/terms | unit | tests/acceptance-matrix.test.ts A-08 | local | PASS | vitest | VERIFIED | amount taken from locked link |
| A-09 | Delivery deadline from paid time | unit | tests/acceptance-matrix.test.ts A-09 | local | PASS | vitest | VERIFIED | PT48H from providerAuthoritativePaidAt |
| B-01 | Redirect is not capture | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | CREATED until provider event |
| B-02 | Duplicate webhook one journal | unit+sim | create-checkout.test.ts; simulator duplicate-webhook | local | PASS | vitest + mock:scenario | VERIFIED | inbox dedupe |
| B-03 | Out-of-order events converge | unit+sim | tests/acceptance-matrix.test.ts B-03; simulator out-of-order-events | local | PASS | vitest | VERIFIED | late AUTHORIZED leaves CAPTURED |
| B-04 | Unknown verified event retained | sim | simulator unknown-valid-event | local | PASS | mock:scenario | VERIFIED | ALERT_UNKNOWN_PROVIDER_EVENT outbox |
| B-05 | Invalid signature rejected | unit+sim | create-checkout.test.ts; simulator invalid-signature | local | PASS | vitest | VERIFIED | UNAUTHENTICATED |
| B-06 | Stale timestamp rejected | unit | tests/acceptance-matrix.test.ts B-06 | local | PASS | vitest | VERIFIED | mock adapter 5-minute window |
| B-07 | Replay rejected | unit | tests/acceptance-matrix.test.ts B-07 | local | PASS | vitest | VERIFIED | duplicate providerEventId |
| B-08 | Key rotation overlap | unit+sim | tests/acceptance-matrix.test.ts B-08; simulator key-rotation-overlap | local | PASS | vitest | VERIFIED | previous v0 key accepted |
| B-09 | Provider outage retryable, no phantom | unit+sim | tests/acceptance-matrix.test.ts B-09; simulator provider-timeout-unknown | local | PASS | vitest | VERIFIED | PROVIDER_UNAVAILABLE, no journal |
| B-10 | Checkout return no open redirect | unit+e2e | tests/acceptance-matrix.test.ts B-10; tests/e2e/ux-quality.spec.ts | local chromium | PASS | vitest + playwright | VERIFIED | `safeCheckoutReturnPath` |
| B-11 | Amount/currency/portfolio server-controlled | unit | tests/acceptance-matrix.test.ts B-11 | local | PASS | vitest | VERIFIED | snapshot pins mock-portfolio |
| B-12 | Mock descriptor is synthetic | unit | tests/acceptance-matrix.test.ts B-12 | local | PASS | vitest | VERIFIED | TRUST*CREATOR + descriptorIsSynthetic |
| B-13 | Snapshot cannot drift after payment | unit | tests/acceptance-matrix.test.ts B-13 | local | PASS | vitest | VERIFIED | versions stored on snapshot |
| B-14 | Checkout/receipt same descriptor | unit+e2e | B-11 snapshot; guest-checkout receipt copy | local | PASS | vitest + playwright | VERIFIED | receipt shows synthetic qualifier |
| C-01 | Balanced journals | unit+sql | create-checkout.test.ts; tests/pg-uow.test.ts | local | PASS | vitest | VERIFIED | debit=credit |
| C-02 | Fees/reserves not revenue | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | separate account codes |
| C-03 | Partial/full refund compensating | unit+sim | create-checkout.test.ts; simulator partial-then-full-refund | local | PASS | vitest | VERIFIED | refundable cap |
| C-04 | Chargeback after payout | unit+sim | tests/acceptance-matrix.test.ts C-04; simulator chargeback-after-payout | local | PASS | vitest | VERIFIED | receivable, no auto-refund |
| C-05 | Re-run cannot double post | unit | tests/acceptance-matrix.test.ts C-05 | local | PASS | vitest | VERIFIED | recapture idempotent |
| C-06 | Dashboard equals ledger projections | unit | tests/acceptance-matrix.test.ts C-06 | local | PASS | vitest | VERIFIED | available/reserved/paid as-of |
| C-07 | Reconciliation missing capture/fee/refund/reserve/payout | unit | tests/acceptance-matrix.test.ts C-07 | local | PASS | vitest | VERIFIED | runReconciliation |
| C-08 | Manual adjustment dual-control | unit | tests/acceptance-matrix.test.ts C-08 | local | PASS | vitest | VERIFIED | reason + second approver |
| C-09 | Restore from backup then reconcile | n/a | docs/runbooks/migration.md; REL-011 | n/a | n/a | docs/runbooks | NOT_APPLICABLE | No live host/PITR target in PROVIDER_AGNOSTIC; procedure documented |
| D-01 | Mark delivered idempotent | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| D-02 | Buyer confirmation authorization | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | guest scope required |
| D-03 | Dispute window enforced | unit | tests/acceptance-matrix.test.ts D-03 | local | PASS | vitest | VERIFIED | 30-day mock window |
| D-04 | Internal dispute + network chargeback | unit | tests/acceptance-matrix.test.ts D-04 | local | PASS | vitest | VERIFIED | no double refund |
| D-05 | Dispute refund staff + idempotency | unit | tests/acceptance-matrix.test.ts D-05 | local | PASS | vitest | VERIFIED | OPS PAYMENTS/DISPUTES + step-up |
| D-06 | Restricted T&S bypasses commercial SLA | unit | tests/acceptance-matrix.test.ts D-06 | local | PASS | vitest | VERIFIED | routeReport |
| D-07 | IP/DMCA/legal/sanctions/laundering routing | unit | tests/acceptance-matrix.test.ts D-07 | local | PASS | vitest | VERIFIED | restricted case types |
| D-08 | Unknown required policy state fail-closed | unit | tests/acceptance-matrix.test.ts D-08; create-checkout.test.ts | local | PASS | vitest | VERIFIED | REQUIRED_STATE_UNKNOWN |
| D-09 | No routine explicit-media upload | static | tests/static-invariants.test.ts; tests/security.test.ts | local | PASS | vitest | VERIFIED | no type=file |
| D-10 | Historical snapshot used in adjudication | unit | tests/acceptance-matrix.test.ts D-10 | local | PASS | vitest | VERIFIED | snapshot policy versions |
| E-01 | No eligible transaction → no review | unit | tests/acceptance-matrix.test.ts E-01 | local | PASS | vitest | VERIFIED | |
| E-02 | One review per transaction | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | STATE_CONFLICT on second |
| E-03 | Creator cannot review self | unit | tests/acceptance-matrix.test.ts E-03 | local | PASS | vitest | VERIFIED | |
| E-04 | Refunded review excluded from aggregate | unit | tests/acceptance-matrix.test.ts E-04 | local | PASS | vitest | VERIFIED | includedInAggregate=false |
| E-05 | Public rating thresholds | unit | packages/trust/src/trust.test.ts | local | PASS | vitest | VERIFIED | 10 reviews / 20 unique buyers |
| E-06 | Trust snapshot versioned | unit | tests/acceptance-matrix.test.ts E-06 | local | PASS | vitest | VERIFIED | trust.v1 |
| E-07 | Private risk never in public DTO | unit | tests/acceptance-matrix.test.ts E-07 | local | PASS | vitest | VERIFIED | publicCreatorDto |
| E-08 | Handle change preserves reputation id | unit | tests/acceptance-matrix.test.ts E-08 | local | PASS | vitest | VERIFIED | same creatorId |
| E-09 | Self-purchase fixtures do not unlock HIGH | unit | tests/acceptance-matrix.test.ts E-09 | local | PASS | vitest | VERIFIED | integrityFlags keep BUILDING |
| F-01 | Payout destination requires step-up | unit | tests/acceptance-matrix.test.ts F-01 | local | PASS | vitest | VERIFIED | STEP_UP_REQUIRED |
| F-02 | Destination change audits and holds | unit | tests/acceptance-matrix.test.ts F-02 | local | PASS | vitest | VERIFIED | payoutHold + EMAIL_SECURITY_ALERT |
| F-03 | Recovery holds payouts / steps down | unit | tests/acceptance-matrix.test.ts F-03 | local | PASS | vitest | VERIFIED | ACCOUNT_RECOVERY + SESSION_REVOKE_ALL |
| F-04 | Public HIGH trust cannot bypass payout rules | unit | tests/acceptance-matrix.test.ts F-04; packages/risk | local | PASS | vitest | VERIFIED | evaluatePayoutRisk ignores trust tier |
| F-05 | Human override reason/actor/expiry | unit | tests/acceptance-matrix.test.ts F-05 | local | PASS | vitest | VERIFIED | recordRiskOverride |
| F-06 | Kill switches server-side | unit | tests/acceptance-matrix.test.ts L-02 / F-06 | local | PASS | vitest | VERIFIED | checkout/links/review/payout flags |
| F-07 | No instant payout path | unit | tests/acceptance-matrix.test.ts F-07 | local | PASS | vitest | VERIFIED | 48h cooldown; instantPayoutSupported=false |
| G-01 | Creator A cannot access Creator B | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | NOT_FOUND |
| G-02 | Creator DTO has no buyer identity | unit | tests/acceptance-matrix.test.ts G-02 | local | PASS | vitest | VERIFIED | assertNoCreatorLeak |
| G-03 | Guest credential one transaction | unit | create-checkout.test.ts | local | PASS | vitest | VERIFIED | |
| G-04 | Public order code is not auth | unit | create-checkout.test.ts; tests/security.test.ts | local | PASS | vitest | VERIFIED | denyOrderCodeAuth |
| G-05 | Revoked guest token | unit | tests/acceptance-matrix.test.ts G-05 | local | PASS | vitest | VERIFIED | revokeGuestToken |
| G-06 | Enumeration consistent not-found | unit | tests/acceptance-matrix.test.ts G-06 | local | PASS | vitest | VERIFIED | same message |
| G-07 | Admin roles object/function | unit | tests/acceptance-matrix.test.ts G-07 | local | PASS | vitest | VERIFIED | assertOpsRole |
| G-08 | Sensitive read audited | unit | tests/acceptance-matrix.test.ts G-08 | local | PASS | vitest | VERIFIED | EXPORT_READ |
| G-09 | Account deletion anonymize/retain | unit | tests/acceptance-matrix.test.ts G-09 | local | PASS | vitest | VERIFIED | planAccountClosure |
| G-10 | Legal hold blocks deletion | unit | tests/acceptance-matrix.test.ts G-10 | local | PASS | vitest | VERIFIED | LEGAL_HOLD |
| G-11 | Export/search hide restricted fields | unit | tests/acceptance-matrix.test.ts G-11 | local | PASS | vitest | VERIFIED | planDataExport + opsCaseDto |
| H-01 | Private routes no-store | static+e2e | tests/e2e/ux-quality.spec.ts; next.config.ts | local | PASS | playwright | VERIFIED | /api cache-control |
| H-02 | Secrets absent from logs | unit | packages/observability/src/redaction.test.ts | local | PASS | vitest | VERIFIED | PAN/CVV rejected |
| H-03 | noindex beta routes | static+e2e | tests/e2e/ux-quality.spec.ts; layout robots | local | PASS | playwright | VERIFIED | X-Robots-Tag |
| H-04 | SW never caches private | static | tests/security.test.ts; tests/static-invariants.test.ts | local | PASS | vitest | VERIFIED | sw.js prefixes |
| H-05 | CSP blocks unapproved scripts | static+e2e | next.config.ts; tests/e2e/ux-quality.spec.ts | local | PASS | playwright | VERIFIED | default-src 'self' |
| H-06 | HSTS/nosniff/referrer/permissions | static+unit | next.config.ts; tests/acceptance-matrix.test.ts H-06 | local | PASS | vitest | VERIFIED | |
| H-07 | No permissive wildcard CORS | static | tests/static-invariants.test.ts | local | PASS | vitest | VERIFIED | no Access-Control-Allow-Origin |
| H-08 | No auth token in localStorage | static | tests/static-invariants.test.ts | local | PASS | vitest | VERIFIED | |
| H-09 | XSS payloads render inert | static | tests/static-invariants.test.ts H-09 | local | PASS | vitest | VERIFIED | no dangerouslySetInnerHTML |
| H-10 | No arbitrary server-side fetch/SSRF | static | tests/static-invariants.test.ts H-10 | local | PASS | vitest | VERIFIED | API routes |
| I-01 | Passkey RP/origin/UV | unit+static | tests/acceptance-matrix.test.ts I-01; packages/auth/src/better-auth.ts | local | PASS | vitest | VERIFIED | userVerification required |
| I-02 | Challenge one-time and expires | unit | tests/acceptance-matrix.test.ts I-02 | local | PASS | vitest | VERIFIED | MAGIC_LINK_TTL_MS |
| I-03 | Session rotates after elevation | unit | tests/acceptance-matrix.test.ts I-03 | local | PASS | vitest | VERIFIED | rotateSession |
| I-04 | Cookie attributes | unit | tests/acceptance-matrix.test.ts I-04 | local | PASS | vitest | VERIFIED | HttpOnly/Secure/SameSite=Lax |
| I-05 | Magic-link resists enumeration | unit | tests/acceptance-matrix.test.ts I-05; magic-link route | local | PASS | vitest | VERIFIED | same public ack |
| I-06 | Recovery cannot immediately change payout | unit | tests/acceptance-matrix.test.ts I-06 / F-03 | local | PASS | vitest | VERIFIED | cooldown + payoutHold |
| I-07 | Admin vs customer cookies isolated | unit | tests/acceptance-matrix.test.ts I-07 | local | PASS | vitest | VERIFIED | paid_session vs paid_ops_session |
| I-08 | Concurrent logout/revocation | unit | tests/acceptance-matrix.test.ts I-08 | local | PASS | vitest | VERIFIED | revokeSessions |
| J-01 | Domain+outbox atomic | unit+sql | tests/pg-uow.test.ts; apps/worker/src/processor.test.ts | local | PASS | vitest | VERIFIED | rollback drops domain writes |
| J-02 | Crash after side effect no duplicate | unit | apps/worker/src/processor.test.ts J-02 | local | PASS | vitest | VERIFIED | email mock idempotent |
| J-03 | Retry backoff/jitter/dedupe | unit | apps/worker/src/processor.test.ts J-03 | local | PASS | vitest | VERIFIED | availableAt in future |
| J-04 | Dead-letter | unit | apps/worker/src/processor.test.ts J-04 | local | PASS | vitest | VERIFIED | DEAD_LETTER after maxAttempts |
| J-05 | Email outage does not roll back capture | unit | tests/acceptance-matrix.test.ts J-05 | local | PASS | vitest | VERIFIED | journal precedes email job |
| J-06 | Email privacy-safe | static | tests/static-invariants.test.ts J-06 | local | PASS | vitest | VERIFIED | toDigest only |
| J-07 | Bounce without leaking identity | sim | simulator email-bounce | local | PASS | mock:scenario | VERIFIED | accepted=false, no raw email |
| J-08 | Time-based jobs two worker passes | unit | apps/worker/src/processor.test.ts J-01 | local | PASS | vitest | VERIFIED | second processOutbox = 0 |
| K-01 | 320px/390px no horizontal clip | e2e | tests/e2e/ux-quality.spec.ts K-01 | local chromium | PASS | playwright | VERIFIED | |
| K-02 | No material layout shift from dynamic data | e2e | tests/e2e/core-pages.spec.ts | local chromium | PASS | playwright | VERIFIED | public page stable heading |
| K-03 | Mobile keyboard vs submit | e2e+css | tests/e2e/ux-quality.spec.ts 390px; apps/web/app/globals.css .page padding | local chromium | PASS | playwright | VERIFIED | 96px bottom padding + 52px controls |
| K-04 | Back/refresh reconstructs non-secret state | e2e | tests/e2e/guest-checkout.spec.ts reload | local chromium | PASS | playwright | VERIFIED | Paid + guest-authorized after reload |
| K-05 | Buttons cannot double-submit | e2e | tests/e2e/guest-checkout.spec.ts checkoutPosts | local chromium | PASS | playwright | VERIFIED | one POST |
| K-06 | Errors preserve valid form input | e2e | tests/e2e/ux-quality.spec.ts K-06 | local chromium | PASS | playwright | VERIFIED | invalid amount kept |
| K-07 | Keyboard-only focus order | e2e | tests/e2e/ux-quality.spec.ts K-07 | local chromium | PASS | playwright | VERIFIED | pay control focusable |
| K-08 | Screen-reader labels via automated a11y | e2e | tests/e2e/core-pages.spec.ts axe | local chromium | PASS | playwright | VERIFIED | no critical/serious |
| K-09 | 200% text zoom | e2e | tests/e2e/ux-quality.spec.ts K-09 | local chromium | PASS | playwright | VERIFIED | heading remains visible |
| K-10 | Reduced motion respected | e2e+css | tests/e2e/ux-quality.spec.ts K-10; packages/ui/src/tokens.css | local chromium | PASS | playwright | VERIFIED | prefers-reduced-motion |
| K-11 | No generic dashboard clutter | e2e | tests/e2e/core-pages.spec.ts | local chromium | PASS | playwright | VERIFIED | product copy, not KPI widgets |
| L-01 | Production refuses mock checkout | unit | packages/config/src/fail-closed.test.ts | local | PASS | vitest | VERIFIED | MOCK_PAYMENTS_IN_PRODUCTION |
| L-02 | Kill switches tested | unit | tests/acceptance-matrix.test.ts L-02 | local | PASS | vitest | VERIFIED | |
| L-03 | Database PITR/backup restore exercised | n/a | docs/runbooks/migration.md | n/a | n/a | runbooks | NOT_APPLICABLE | Live-host operator gate; no production cluster |
| L-04 | Restore requires reconciliation before money | n/a | docs/runbooks/migration.md; REL-011 | n/a | n/a | runbooks | NOT_APPLICABLE | Same live-host gate as L-03/C-09 |
| L-05 | Processor outage runbook executable | static | docs/runbooks/provider-outage.md | local | PASS | docs | VERIFIED | owner, containment, recon |
| L-06 | Recon break cannot be hidden by editing balance | unit | tests/acceptance-matrix.test.ts C-07 | local | PASS | vitest | VERIFIED | append-only journals |
| L-07 | Metrics/logging without restricted data | unit | packages/observability/src/redaction.test.ts | local | PASS | vitest | VERIFIED | |
| L-08 | External compliance decisions versioned | static+unit | docs/external-compliance-decisions.md; snapshot policy versions | local | PASS | docs + vitest D-10 | VERIFIED | cannot rewrite snapshots |
| L-09 | Failed/dormant payout not platform revenue | unit+sim | tests/acceptance-matrix.test.ts L-09; simulator payout-failure-and-retry | local | PASS | vitest | VERIFIED | |
| L-10 | Analytics failure does not block checkout | static | tests/static-invariants.test.ts L-13 (create-checkout has no analytics) | local | PASS | vitest | VERIFIED | |
| L-11 | Fresh DB + first schema migration | unit | tests/migrations.test.ts; 0001_init.sql; 0002_auth_outbox.sql | local | PASS | vitest | VERIFIED | migrate applies sorted SQL; 0002 additive |
| L-12 | Old/new app versions process events | unit+sim | canonical schemaVersion; unknown-valid-event | local | PASS | vitest + mock:scenario | VERIFIED | unknown retained |
| L-13 | SBOM/dependency/secrets/build manifest | script | scripts/sbom.mjs; docs/evidence/sbom.json | local | PASS | pnpm sbom | VERIFIED | |
| L-14 | Release artifact maps to commit + migration | docs | docs/evidence/release-dossier.md | local | PASS | dossier | VERIFIED | SHA `68b207f`; 0001_init + 0002_auth_outbox |
| BRAND-01 | Customer-facing surfaces use Paid | static+e2e | tests/static-invariants.test.ts; core-pages | local | PASS | vitest + playwright | VERIFIED | |
| BRAND-02 | Domain examples use paid.example | static | tests/static-invariants.test.ts; seed | local | PASS | vitest | VERIFIED | maya@paid.example |
| BRAND-03 | No trademark/escrow/absolute-guarantee claims | static | tests/static-invariants.test.ts | local | PASS | vitest | VERIFIED | |
| BRAND-04 | Store-metadata fallback without changing entities | static | apps/web/public/manifest.webmanifest | local | PASS | file | VERIFIED | PWA name Paid; canonical entities unchanged |
