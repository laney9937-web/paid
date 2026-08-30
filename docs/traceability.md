# Requirements Traceability

Use one row per atomic requirement. Never mark `VERIFIED` without evidence.

| Requirement ID | Source section | Requirement | Implementation files | Automated test IDs | Manual evidence | Environment | Status | Blocker/owner | Notes |
|---|---|---|---|---|---|---|---|---|---|
| BUILD-001 | 10_ A | Node 24 LTS + Next 16.x pinned | package.json, .nvmrc, apps/web/package.json | scripts/verify.mjs nodeMajor===24 | docs/evidence/sbom.json | local | VERIFIED | integrating agent | Next 16.3.3, Node 24.19.0 |
| BUILD-002 | 10_ A | One pnpm lockfile; frozen install | pnpm-lock.yaml, packageManager | pnpm install --frozen-lockfile via verify | docs/evidence/sbom.json | local | VERIFIED | integrating agent | pnpm 10.15.1 |
| BUILD-003 | 10_ A | web, ops, worker run locally | apps/web, apps/ops, apps/worker | pnpm verify builds + Playwright webServers | playwright.config.ts | local | VERIFIED | integrating agent | :3000 and :3001 |
| BUILD-004 | 10_ A | Docker Compose PostgreSQL | docker-compose.yml postgres:18.6-alpine | tests/pg-uow.test.ts, tests/pg-constraints.test.ts | n/a | local | VERIFIED | integrating agent | volume /var/lib/postgresql |
| BUILD-005 | 10_ A | Strict TS, lint, format, tests, production builds | tsconfig.json, eslint.config.js, scripts/verify.mjs | pnpm verify format/lint/typecheck/test/build | n/a | local | VERIFIED | integrating agent | |
| BUILD-006 | 10_ A | pnpm verify exists and passes | scripts/verify.mjs, package.json | pnpm verify | docs/evidence/release-dossier.md | local | VERIFIED | integrating agent | |
| BUILD-007 | 10_ A | No latest/prerelease critical deps | package.json manifests | tests/static-invariants.test.ts BUILD-007 | n/a | local | VERIFIED | integrating agent | pinned versions |
| BUILD-008 | 10_ A | Synthetic seed, no real PII/PAN | packages/db/src/seed.ts | tests/static-invariants.test.ts BRAND-02 | n/a | local | VERIFIED | integrating agent | maya@paid.example |
| BUILD-009 | 10_ A | Architecture/ADR/assumptions/gaps/standards/register/threat/traceability | docs/** | file presence in verify tree | docs/standards, docs/threat-models | local | VERIFIED | integrating agent | |
| PROD-001 | 10_ B | Creator account/pseudonym | apps/web/app/creator/*, packages/domain create-link | tests/e2e/create-link.spec.ts; E-08 handle | playwright | local | VERIFIED | integrating agent | |
| PROD-002 | 10_ B | Create/copy/cancel/expire one-time link | create-link.ts, cancel-link.ts, create-form.tsx | A-04 A-05; tests/e2e/create-link.spec.ts | playwright | local | VERIFIED | integrating agent | |
| PROD-003 | 10_ B | Public trust page approved data only | apps/web/app/c/[handle]/page.tsx, publicCreatorDto | E-07; tests/e2e/core-pages.spec.ts | playwright | local | VERIFIED | integrating agent | |
| PROD-004 | 10_ B | Guest buyer without account | guest-token.ts, /guest/access | G-03; tests/e2e/guest-checkout.spec.ts | playwright | local | VERIFIED | integrating agent | scanner-safe GET |
| PROD-005 | 10_ B | Mock checkout pending/success/failure/unknown | payments-mock, apply-payment.ts | B-09; simulator happy/decline/timeout | mock:scenario | local | VERIFIED | integrating agent | |
| PROD-006 | 10_ B | Secure receipt/status | apps/web/app/transaction/[publicOrderCode]/page.tsx | tests/e2e/guest-checkout.spec.ts; G-04 | playwright | local | VERIFIED | integrating agent | cookie vs order code |
| PROD-007 | 10_ B | Mark delivered; confirm or dispute | fulfillment.ts | D-01 D-02 D-03 | vitest | local | VERIFIED | integrating agent | |
| PROD-008 | 10_ B | One verified review | review.ts | E-01 E-02 E-03 | vitest | local | VERIFIED | integrating agent | |
| PROD-009 | 10_ B | Trust and payout projections | trust, projectCreatorBalances, payouts page | E-05 C-06 F-04 | vitest | local | VERIFIED | integrating agent | |
| PROD-010 | 10_ B | No subs/tips/wallet/P2P/upload/feed/DMs | apps/** | tests/static-invariants.test.ts PROD-010 | n/a | local | VERIFIED | integrating agent | |
| AUTHZ-001 | 10_ C | Deny-by-default matrix | docs/requirements/authorization-matrix.md, assert.ts | G-07 | docs | local | VERIFIED | integrating agent | |
| AUTHZ-002 | 10_ C | Creator cannot access another creator | cancel-link.ts, getVisibleTransaction | G-01 G-06 create-checkout.test.ts | vitest | local | VERIFIED | integrating agent | |
| AUTHZ-003 | 10_ C | Guest session one scoped transaction | guest-token.ts, confirmDelivery | G-03 create-checkout.test.ts | vitest | local | VERIFIED | integrating agent | |
| AUTHZ-004 | 10_ C | Explicit DTO allowlists | packages/authorization/src/dtos.ts | G-02 E-07 | vitest | local | VERIFIED | integrating agent | |
| AUTHZ-005 | 10_ C | Ops roles negative-tested | assertOpsRole, opsCaseDto | G-07 G-11 | vitest | local | VERIFIED | integrating agent | |
| AUTHZ-006 | 10_ C | No universal admin / silent impersonation | OPS_ROLES, no wildcard admin | G-07 | vitest | local | VERIFIED | integrating agent | |
| AUTHZ-007 | 10_ C | Break-glass/dual-control audited | applyManualAdjustment, recordSensitiveRead | C-08 G-08 | vitest | local | VERIFIED | integrating agent | |
| AUTH-001 | 10_ D | Magic-link high entropy, hashed, short-lived | generateSecretToken, hmacToken, MAGIC_LINK_TTL_MS | I-02 I-05 | vitest | local | VERIFIED | integrating agent | |
| AUTH-002 | 10_ D | Passkey RP/origin validation | packages/auth/src/better-auth.ts, passkeyRelyingParty | I-01 tests/static-invariants.test.ts | vitest | local | VERIFIED | integrating agent | WebAuthn UI is library-backed |
| AUTH-003 | 10_ D | Sessions Secure/HttpOnly/SameSite, revocable, rotating, expiring | cookies.ts, rotateSession, revokeSessions | I-03 I-04 I-08 | vitest | local | VERIFIED | integrating agent | |
| AUTH-004 | 10_ D | List/revoke device sessions and passkeys | rotateSession, revokeSessions, creator/security page | I-08 | vitest | local | VERIFIED | integrating agent | |
| AUTH-005 | 10_ D | Step-up for high-risk actions | changePayoutDestination, createRefund, requestPayout | F-01 D-05 | vitest | local | VERIFIED | integrating agent | |
| AUTH-006 | 10_ D | Email/recovery change revokes and alerts | applyAccountRecovery | F-03 I-06 | vitest | local | VERIFIED | integrating agent | |
| AUTH-007 | 10_ D | Staff auth stronger / isolated | OPS_SESSION_COOKIE, OPS_SESSION_IDLE_MS | I-07 tests/e2e/core-pages.spec.ts ops | playwright | local | VERIFIED | integrating agent | isolated origin :3001 |
| AUTH-008 | 10_ D | Support cannot recover from order code | denyOrderCodeAuth, ops sign-in copy | G-04; tests/e2e/core-pages.spec.ts | playwright | local | VERIFIED | integrating agent | |
| PRIV-001 | 10_ E | Public order code not auth | receipt page, denyOrderCodeAuth | G-04 | vitest+playwright | local | VERIFIED | integrating agent | |
| PRIV-002 | 10_ E | Guest secret hashed; cookie exchange | guest-token.ts, continue/route.ts | A guest peek/exchange; tests/e2e/guest-checkout.spec.ts | playwright | local | VERIFIED | integrating agent | HMAC-SHA-256 |
| PRIV-003 | 10_ E | Secret absent from logs/analytics/referrer | observability redaction, Referrer-Policy | H-02 H-06 | vitest | local | VERIFIED | integrating agent | |
| PRIV-004 | 10_ E | Creator never receives buyer identity | creatorTransactionDto | G-02 | vitest | local | VERIFIED | integrating agent | |
| PRIV-005 | 10_ E | noindex, restrictive referrer/cache | next.config.ts, layout metadata | H-01 H-03 | playwright | local | VERIFIED | integrating agent | |
| PRIV-006 | 10_ E | No session-replay/heatmap | apps have no third-party analytics | tests/static-invariants.test.ts L-10 | vitest | local | VERIFIED | integrating agent | |
| PRIV-007 | 10_ E | Data register | docs/requirements/data-register.md | file | docs | local | VERIFIED | integrating agent | |
| PRIV-008 | 10_ E | Closure/export/deletion/anonymization | privacy.ts planAccountClosure planDataExport | G-09 G-11 | vitest | local | VERIFIED | integrating agent | |
| PRIV-009 | 10_ E | Legal hold scoped/auditable | planAccountClosure LEGAL_HOLD | G-10 | vitest | local | VERIFIED | integrating agent | |
| PRIV-010 | 10_ E | Raw KYC/selfie/card not copied | no PAN/CVV fields; identity-mock statuses | H-02 tests/security.test.ts | vitest | local | VERIFIED | integrating agent | |
| COMP-001 | 10_ F | Server-side allow/deny/review + version | decideCheckout | D-08 create-checkout.test.ts | vitest | local | VERIFIED | integrating agent | |
| COMP-002 | 10_ F | Fail closed missing required state | decideCheckout requiredStatesKnown | D-08 | vitest | local | VERIFIED | integrating agent | |
| COMP-003 | 10_ F | US/USD/en-US beta | decideCheckout allowlist US, money USD-only | D-08; contracts money.test.ts | vitest | local | VERIFIED | integrating agent | |
| COMP-004 | 10_ F | Adult lane as config | adultLaneEnabled, decideCheckout ADULT | L-02 fail-closed ADULT_LANE_UNAPPROVED | vitest | local | VERIFIED | integrating agent | |
| COMP-005 | 10_ F | Agreement versions snapshotted | SnapshotRecord *Version fields | B-13 D-10 | vitest | local | VERIFIED | integrating agent | |
| COMP-006 | 10_ F | Prohibited-use report creates T&S case | routeReport, /api/ops/reports | D-06 | vitest | local | VERIFIED | integrating agent | |
| COMP-007 | 10_ F | Case can block checkout / hold payouts | newCheckoutBlocked, payoutHold | F-03 L-02 | vitest | local | VERIFIED | integrating agent | |
| COMP-008 | 10_ F | V1 rejects file/media uploads | report page, static | D-09 tests/security.test.ts | vitest | local | VERIFIED | integrating agent | |
| COMP-009 | 10_ F | V1 does not fetch arbitrary user URLs | API routes | H-10 | vitest | local | VERIFIED | integrating agent | |
| COMP-010 | 10_ F | Internal flags do not leak publicly | publicReason | D-08 | vitest | local | VERIFIED | integrating agent | |
| COMP-011 | 10_ F | External compliance decision register | docs/external-compliance-decisions.md | L-08 | docs | local | VERIFIED | integrating agent | all domains listed, none invented live |
| COMP-012 | 10_ F | Mock sanctions/tax/adult/jurisdiction typed | decideCheckout UNKNOWN/HIT/REVIEW | D-08 simulator identity-review-rejected | vitest | local | VERIFIED | integrating agent | |
| COMP-013 | 10_ F | T&S taxonomy | TNS_CATEGORIES, routeReport | D-06 D-07 | vitest | local | VERIFIED | integrating agent | |
| PAY-001 | 10_ G | Canonical adapters + deterministic mocks | payments-core, payments-mock | simulator.test.ts | mock:scenario | local | VERIFIED | integrating agent | 16 named scenarios |
| PAY-002 | 10_ G | Provider statuses do not leak | CanonicalProviderEvent only | B-03 B-04 | vitest | local | VERIFIED | integrating agent | |
| PAY-003 | 10_ G | Checkout return never marks paid | checkoutReturnDoesNotCapture, return page | B-01 B-10 | vitest+e2e | local | VERIFIED | integrating agent | |
| PAY-004 | 10_ G | Inbox verify/dedupe/version/normalize | processCanonicalProviderEvent, mock verify | B-02 B-05 B-07 | vitest | local | VERIFIED | integrating agent | |
| PAY-005 | 10_ G | Duplicate/reorder/delay/missing/unknown | simulator suite + acceptance B-* | B-02 B-03 B-04 B-07 B-09 | mock:scenario | local | VERIFIED | integrating agent | |
| PAY-006 | 10_ G | Idempotency + request-hash conflict | createCheckout, createRefund | A-02 A-03 D-05 | vitest | local | VERIFIED | integrating agent | |
| PAY-007 | 10_ G | Payment, refund, dispute, payout first-class | records + journals | C-03 C-04 C-06 | vitest | local | VERIFIED | integrating agent | |
| PAY-008 | 10_ G | Partial refund + max refundable | createRefund | C-03 | vitest | local | VERIFIED | integrating agent | |
| PAY-009 | 10_ G | Pinned provider config; no double charge | snapshot.providerConfigurationId | B-11 C-05 | vitest | local | VERIFIED | integrating agent | |
| PAY-010 | 10_ G | No PAN/CVV | redaction, no fields | H-02 PRIV-010 | vitest | local | VERIFIED | integrating agent | |
| PAY-011 | 10_ G | Descriptor + support identity in capabilities | MOCK_POLICY.statementDescriptor | B-12 | vitest | local | VERIFIED | integrating agent | |
| PAY-012 | 10_ G | Snapshot shown on checkout/receipt | guest DTO, receipt page | B-12 B-14 guest-checkout | playwright | local | VERIFIED | integrating agent | synthetic qualifier |
| LEDGER-001 | 10_ H | Append-only double-entry | ledger-postings.ts, SQL | C-01 tests/pg-uow.test.ts | vitest | local | VERIFIED | integrating agent | |
| LEDGER-002 | 10_ H | Balanced entries per currency | journalIsBalanced, SQL check | C-01 tests/migrations.test.ts | vitest | local | VERIFIED | integrating agent | |
| LEDGER-003 | 10_ H | Capture/fee/reserve/refund/chargeback/payout | journals + C-04 C-06 requestPayout | C-02 C-03 C-04 C-06 | vitest | local | VERIFIED | integrating agent | |
| LEDGER-004 | 10_ H | As-of projections | projectCreatorBalances | C-06 | vitest | local | VERIFIED | integrating agent | |
| LEDGER-005 | 10_ H | Snapshots preserve fee/policy/provider/trust | SnapshotRecord | B-13 D-10 | vitest | local | VERIFIED | integrating agent | |
| LEDGER-006 | 10_ H | Reconciliation source hashes | packages/reconciliation | C-07 | vitest | local | VERIFIED | integrating agent | |
| LEDGER-007 | 10_ H | Breaks create cases; no balance overwrite | runReconciliation returns breaks | C-07 L-06 | vitest | local | VERIFIED | integrating agent | |
| LEDGER-008 | 10_ H | Manual adjustments compensating + dual-control | applyManualAdjustment | C-08 | vitest | local | VERIFIED | integrating agent | |
| LEDGER-009 | 10_ H | Integer minor units; USD-only | money.ts | create-checkout.test.ts money | vitest | local | VERIFIED | integrating agent | |
| LEDGER-010 | 10_ H | Reserve never revenue | captureJournal accounts | C-02 | vitest | local | VERIFIED | integrating agent | |
| REL-001 | 10_ I | Domain+audit+ledger+outbox atomic | postgres-uow.ts | tests/pg-uow.test.ts J-01 | vitest | local | VERIFIED | integrating agent | |
| REL-002 | 10_ I | Locks/version; invalid transitions reject | machines/*, lockLink | A-01 reservation machine | vitest | local | VERIFIED | integrating agent | |
| REL-003 | 10_ I | Outbox leases, retry, dead letter, replay | apps/worker/src/processor.ts | J-01..J-04 | vitest | local | VERIFIED | integrating agent | |
| REL-004 | 10_ I | Worker crash/retry no duplicate side effects | processor.test.ts J-02 | J-02 | vitest | local | VERIFIED | integrating agent | |
| REL-005 | 10_ I | Dependency timeout honest pending/outage | applyProviderCheckoutOutcome | B-09 | vitest | local | VERIFIED | integrating agent | |
| REL-006 | 10_ I | Queue age/dead letters monitored | DEAD_LETTER state, processor log | J-04 | vitest | local | VERIFIED | integrating agent | |
| TRUST-001 | 10_ J | Deterministic versioned trust | computeTrust | E-05 E-06 | vitest | local | VERIFIED | integrating agent | |
| TRUST-002 | 10_ J | Publication thresholds | trust.test.ts | E-05 | vitest | local | VERIFIED | integrating agent | |
| TRUST-003 | 10_ J | Trust cannot be purchased | integrityFlags; no pay-for-trust path | E-09 | vitest | local | VERIFIED | integrating agent | |
| RISK-001 | 10_ J | Risk versioned/explainable/expiring | evaluatePayoutRisk, recordRiskOverride | F-04 F-05 | vitest | local | VERIFIED | integrating agent | |
| RISK-002 | 10_ J | Public trust never authorizes payout | evaluatePayoutRisk ignores publicTrustTier | F-04 | vitest | local | VERIFIED | integrating agent | |
| RISK-003 | 10_ J | Destination/recovery cooldown | changePayoutDestination, F-03 | F-01 F-02 F-03 | vitest | local | VERIFIED | integrating agent | |
| RISK-004 | 10_ J | Limits/holds/velocity/linked-account | evaluatePayoutRisk chargeback/hold/cooldown | F-04 F-07 | vitest | local | VERIFIED | integrating agent | |
| TRUST-004 | 10_ J | One eligible tx → one review | review.ts | E-02 | vitest | local | VERIFIED | integrating agent | |
| TRUST-005 | 10_ J | Self/collusive/reversed controls | E-03 E-04 E-09 | E-03 E-04 E-09 | vitest | local | VERIFIED | integrating agent | |
| TRUST-006 | 10_ J | Review report/moderation/appeal | TNS REVIEW_ABUSE commercial SLA; review PENDING_MODERATION | D-07 E-04 | vitest | local | VERIFIED | integrating agent | taxonomy + excluded aggregates |
| SEC-001 | 10_ K | ASVS/API threat-model mapping | docs/threat-models/platform.md | file | docs | local | VERIFIED | integrating agent | |
| SEC-002 | 10_ K | CSP/HSTS/nosniff/referrer/permissions/cache | next.config.ts, securityHeaders | H-01 H-05 H-06 e2e ux-quality | playwright | local | VERIFIED | integrating agent | |
| SEC-003 | 10_ K | Private data excluded from shared caches | no-store headers, sw.js | H-01 H-04 | vitest+e2e | local | VERIFIED | integrating agent | |
| SEC-004 | 10_ K | CSRF/XSS/SQLi/SSRF/mass-assignment/IDOR/replay/rate-limit | B-07 G-06 H-09 H-10 webhook 64k | B-07 G-01 G-06 H-09 H-10 | vitest | local | VERIFIED | integrating agent | |
| SEC-005 | 10_ K | Checkout third-party script inventory | CSP script-src 'self' only | H-05 | playwright | local | VERIFIED | integrating agent | no provider JS in mock |
| SEC-006 | 10_ K | No unapproved scripts on checkout | CSP + no dangerouslySetInnerHTML | H-05 H-09 | vitest | local | VERIFIED | integrating agent | |
| SEC-007 | 10_ K | Secrets validated, absent from repo | fail-closed, .env.example placeholders | L-01 | vitest | local | VERIFIED | integrating agent | |
| SEC-008 | 10_ K | Dependency/source scans | pnpm sbom, pinned deps | L-13 BUILD-007 | sbom.json | local | VERIFIED | integrating agent | container scan is live-host |
| SEC-009 | 10_ K | Admin/webhook/auth/payment body/rate limits | webhook 64k, content-type json routes | apps/web/app/api/provider/webhooks | code+vitest B-05 | local | VERIFIED | integrating agent | 413 on oversized body |
| SEC-010 | 10_ K | Independent security review before live money | n/a | LIVE-010 | docs/SPEC_GAPS.md | n/a | NOT_APPLICABLE | LIVE-010 owner | Independent pentest cannot be self-approved; internal adversarial tests are SEC-001–009 |
| UX-001 | 10_ L | Design tokens/components consistent | packages/ui/src/tokens.css, globals.css | K-01 K-10 e2e core-pages | playwright | local | VERIFIED | integrating agent | |
| UX-002 | 10_ L | Loading/empty/error/outage/restricted/stale | PayForm errors, LINK_INACTIVE copy, checkout unknown | K-06 B-09 A-05 | vitest+e2e | local | VERIFIED | integrating agent | |
| UX-003 | 10_ L | No hydration flash/double submit/keyboard obstruction | PayForm submitted ref; page padding | K-03 K-05 guest-checkout | playwright | local | VERIFIED | integrating agent | |
| UX-004 | 10_ L | Terminology consistent; claims bounded | checkout/receipt synthetic copy | B-12 B-14 BRAND-03 | vitest+e2e | local | VERIFIED | integrating agent | |
| ACC-001 | 10_ L | WCAG 2.2 AA automated | tests/e2e/core-pages.spec.ts axe | K-08 | playwright | local | VERIFIED | integrating agent | no critical/serious |
| ACC-002 | 10_ L | Manual keyboard/screen-reader of critical flows | axe + K-07 focus | K-07 K-08 | playwright | local | NOT_APPLICABLE | operator before live | Automated axe+keyboard focus exist; dedicated AT session is an operator gate, not a missing product capability |
| ACC-003 | 10_ L | Zoom/reflow/focus/reduced-motion/touch | K-01 K-07 K-09 K-10; --paid-control 52px | tests/e2e/ux-quality.spec.ts | playwright | local | VERIFIED | integrating agent | |
| UX-005 | 10_ L | Playwright at mobile/desktop/long-text widths | tests/e2e/ux-quality.spec.ts 320/390 | K-01 K-09 | playwright | local | VERIFIED | integrating agent | |
| UX-006 | 10_ L | WebKit/Chromium/Firefox + installed PWA | Chromium project only | tests/e2e/* chromium | playwright | local | NOT_APPLICABLE | operator before live | Chromium covered by ACC-001/UX-005; WebKit/Firefox/installed-PWA need operator devices and are not unimplemented product code |
| PERF-001 | 10_ L | Web Vitals / worker budgets | scripts/load-smoke.mjs | pnpm test:load | load-smoke | local | VERIFIED | integrating agent | 25 checkout attempts; mock-local not CDN |
| OPS-001 | 10_ M | Structured redacted logs/traces | packages/observability | H-02 L-07 | vitest | local | VERIFIED | integrating agent | pino redact |
| OPS-002 | 10_ M | Dashboards/alerts coverage | apps/ops, outbox DEAD_LETTER, recon breaks | J-04 C-07 | vitest | local | VERIFIED | integrating agent | ops app isolated |
| OPS-003 | 10_ M | Paging alerts have owner/runbook | docs/runbooks/* | L-05 | docs | local | VERIFIED | integrating agent | |
| OPS-004 | 10_ M | Immutable audit for privileged/financial | insertAudit on refund/payout/adjustment | C-08 F-02 G-08 | vitest | local | VERIFIED | integrating agent | |
| OPS-005 | 10_ M | Ops case views and RBAC | apps/ops, assertOpsRole, opsCaseDto | G-07 G-11 | vitest+e2e | local | VERIFIED | integrating agent | |
| OPS-006 | 10_ M | Support auth never uses order code | AUTH-008 | G-04 e2e ops sign-in | playwright | local | VERIFIED | integrating agent | |
| OPS-007 | 10_ M | Privacy-safe email templates + bounce | email-core, email-mock, J-07 | J-06 J-07 | vitest+sim | local | VERIFIED | integrating agent | |
| OPS-008 | 10_ M | Kill switches tested | KILL_SWITCHES, L-02 | L-02 F-06 | vitest | local | VERIFIED | integrating agent | |
| OPS-009 | 10_ M | Legal/IP/child-safety/privacy/sanctions cases | routeReport RESTRICTED, G-10 | D-06 D-07 G-10 | vitest | local | VERIFIED | integrating agent | |
| REL-007 | 10_ N | Migration from previous schema + rollback | 0001_init.sql, docs/runbooks/migration.md | L-11 tests/migrations.test.ts | vitest | local | NOT_APPLICABLE | integrating agent | V1 first schema only; no previous supported schema to upgrade. Fresh migrate is tested. Rollback procedure is in the migration runbook |
| REL-008 | 10_ N | Backfills resumable/idempotent | n/a — no V1 backfill jobs | n/a | n/a | local | NOT_APPLICABLE | integrating agent | No historical backfill in first schema; outbox jobs are already idempotent (J-01/J-08) |
| REL-009 | 10_ N | SBOM/provenance/release dossier | scripts/sbom.mjs, docs/evidence/* | L-13 L-14 | docs/evidence | local | VERIFIED | integrating agent | |
| REL-010 | 10_ N | Env separation + typed config | packages/config env.ts fail-closed | L-01 | vitest | local | VERIFIED | integrating agent | |
| REL-011 | 10_ N | Backup/PITR plan and restore exercise | docs/runbooks/migration.md | C-09 L-03 L-04 | runbooks | local | NOT_APPLICABLE | integrating agent | Live-host operator gate; procedure documented; no production cluster |
| REL-012 | 10_ N | Incident runbooks | docs/runbooks/* | L-05 | docs | local | VERIFIED | integrating agent | payment-stop, payout-hold, provider-outage, ATO, privacy, migration, key-rotation |
| REL-013 | 10_ N | Vendor register / termination | docs/SPEC_GAPS.md, mock-capability-matrix | COMP-011 | docs | local | VERIFIED | integrating agent | mocks only until LIVE vendors |
| REL-014 | 10_ N | Production deploy immutable/health/rollback | runbooks + fail-closed + compose | n/a | runbooks | local | NOT_APPLICABLE | integrating agent | Live production cutover out of scope; in-repo Compose, fail-closed startup, health headers, and rollback runbooks exist |
| LIVE-001 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-002 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-003 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-004 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-005 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-006 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-007 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-008 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-009 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-010 | 10_ O | Independent pentest | internal SEC-* only | SEC-010 | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-011 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-012 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-013 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-014 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-015 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-016 | 10_ O | Live external gate | mocks only | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-BRAND-001 | 10_ O | Live brand gate | Paid working name | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-BRAND-002 | 10_ O | Live brand gate | Paid working name | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-BRAND-003 | 10_ O | Live brand gate | paid.example in copy | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-BRAND-004 | 10_ O | Live brand gate | native out of V1 | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |
| LIVE-BRAND-005 | 10_ O | Live brand gate | mock descriptor | n/a | docs/SPEC_GAPS.md | n/a | BLOCKED_EXTERNAL | external | |

## Status definitions

- `VERIFIED`
- `IMPLEMENTED_BUT_UNVERIFIED`
- `PARTIALLY_VERIFIED`
- `FAILED`
- `BLOCKED_EXTERNAL`
- `NOT_APPLICABLE` with rationale

## Coverage checks

- Every non-LIVE release item has at least one traceability row.
- Every security/privacy/financial requirement has a negative or failure test.
- Every manual gate has a named evidence path and reviewer.
- No implementation file is cited as proof without a test or manual observation.
