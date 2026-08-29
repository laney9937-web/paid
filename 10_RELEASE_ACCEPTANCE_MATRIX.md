# 10 — Release Acceptance Matrix

Use this as the final checklist. Each item must be `VERIFIED`, `NOT_APPLICABLE` with rationale, or `BLOCKED_EXTERNAL` only where explicitly marked `LIVE-*`. Evidence must reference the corresponding automated/manual scenario in `11_ACCEPTANCE_TEST_MATRIX.md` where applicable.

## A. Repository and build

- [ ] `BUILD-001` Node 24 LTS and patched pinned Next.js 16.x used.
- [ ] `BUILD-002` One pnpm lockfile; frozen install succeeds.
- [ ] `BUILD-003` `apps/web`, `apps/ops`, and `apps/worker` run locally.
- [ ] `BUILD-004` Docker Compose starts disposable PostgreSQL.
- [ ] `BUILD-005` Strict TypeScript, lint, format, tests, and production builds pass.
- [ ] `BUILD-006` `pnpm verify` exists and passes.
- [ ] `BUILD-007` No prerelease/`latest` critical dependencies committed.
- [ ] `BUILD-008` Synthetic seed contains no real personal/payment/adult data.
- [ ] `BUILD-009` Architecture, ADR, assumptions, spec gaps, standards, data register, threat model, and traceability docs exist.

## B. Product scope

- [ ] `PROD-001` Creator can create/manage account and pseudonym.
- [ ] `PROD-002` Creator can create, copy, cancel, and expire one-time transaction link.
- [ ] `PROD-003` Public creator trust page exposes only approved data.
- [ ] `PROD-004` Guest buyer can open transaction page without account.
- [ ] `PROD-005` Mock checkout models pending/success/failure/unknown.
- [ ] `PROD-006` Buyer can view secure receipt/status.
- [ ] `PROD-007` Creator can mark delivered; buyer can confirm or dispute.
- [ ] `PROD-008` Eligible buyer can leave one verified review.
- [ ] `PROD-009` Creator sees trust and payout projections clearly.
- [ ] `PROD-010` No subscriptions, tips, wallet, P2P, media upload, feed, DMs, or discovery added.

## C. Authorization and tenancy

- [ ] `AUTHZ-001` Deny-by-default authorization matrix exists.
- [ ] `AUTHZ-002` Creator cannot access another creator’s private records.
- [ ] `AUTHZ-003` Guest session can access only one scoped transaction.
- [ ] `AUTHZ-004` Public/creator/guest/support/risk/compliance DTOs are explicit allowlists.
- [ ] `AUTHZ-005` Ops roles are separated and negative-tested.
- [ ] `AUTHZ-006` No universal admin or silent impersonation.
- [ ] `AUTHZ-007` Break-glass/dual-control actions are audited.

## D. Authentication and recovery

- [ ] `AUTH-001` Magic-link token is high entropy, hashed, atomic single use, and short lived.
- [ ] `AUTH-002` Passkey enrollment/sign-in works with correct RP/origin validation.
- [ ] `AUTH-003` Sessions are Secure/HttpOnly/SameSite, revocable, rotating, and expiring.
- [ ] `AUTH-004` User can list/revoke device sessions and passkeys.
- [ ] `AUTH-005` Step-up/fresh session enforced for high-risk actions.
- [ ] `AUTH-006` Email/recovery change revokes/restricts appropriately and alerts old channel.
- [ ] `AUTH-007` Staff authentication is stronger than consumer authentication.
- [ ] `AUTH-008` Support cannot recover account from knowledge/order code alone.

## E. Guest privacy

- [ ] `PRIV-001` Public order code is not an auth credential.
- [ ] `PRIV-002` Guest bearer secret stored hashed and exchanged for clean secure cookie session.
- [ ] `PRIV-003` Secret absent from analytics/logs/referrers/error reports.
- [ ] `PRIV-004` Creator never receives buyer payment/legal/fraud/support identity.
- [ ] `PRIV-005` Sensitive pages have noindex, restrictive referrer/cache, generic previews.
- [ ] `PRIV-006` No session-replay/heatmap on sensitive pages.
- [ ] `PRIV-007` Data register defines purpose/access/retention/deletion for every sensitive class.
- [ ] `PRIV-008` Account closure/export/deletion/anonymization jobs are implemented and auditable.
- [ ] `PRIV-009` Legal hold is scoped/auditable.
- [ ] `PRIV-010` Raw KYC/selfie/card data not copied into general platform systems.

## F. Compliance and policy

- [ ] `COMP-001` Server-side compliance/jurisdiction decision returns allow/deny/review with version/reasons.
- [ ] `COMP-002` Checkout fails closed on missing required compliance state.
- [ ] `COMP-003` US/USD/en-US beta restrictions enforced by policy.
- [ ] `COMP-004` Adult/non-adult lane is modeled as provider configuration, not merely UI text.
- [ ] `COMP-005` Agreement/AUP/protection terms accepted with version/hash/evidence.
- [ ] `COMP-006` Prohibited-use report creates auditable T&S case.
- [ ] `COMP-007` Case can disable links/new checkout and hold payouts when authorized.
- [ ] `COMP-008` V1 rejects file/media uploads.
- [ ] `COMP-009` V1 does not fetch arbitrary user URLs.
- [ ] `COMP-010` Internal flags/reasons do not leak publicly.
- [ ] `COMP-011` External compliance decision register separately tracks payments-law, seller/PSE/tax, sanctions/AML, adult/card-network, Section 2257/2257A, child-safety reporting, IP/DMCA, privacy/biometric, unclaimed-funds, and consumer-disclosure ownership without inventing live conclusions.
- [ ] `COMP-012` Mock sanctions/tax/adult/jurisdiction states are typed, versioned, auditable, and fail closed when a required state is unknown.
- [ ] `COMP-013` T&S case taxonomy supports child safety, non-consensual content, prostitution/trafficking, transaction laundering, IP/DMCA, legal/privacy request, and sanctions escalation.

## G. Payments and provider boundary

- [ ] `PAY-001` Canonical adapter interfaces and deterministic mocks exist.
- [ ] `PAY-002` Provider-specific statuses cannot leak into product modules.
- [ ] `PAY-003` Checkout return never marks payment successful by itself.
- [ ] `PAY-004` Provider event inbox verifies/deduplicates/versions/normalizes/reconciles.
- [ ] `PAY-005` Duplicate, reordered, delayed, missing, and unknown provider events tested.
- [ ] `PAY-006` Financial commands use idempotency and request-hash conflict detection.
- [ ] `PAY-007` Payment, refund, network dispute, and payout are separate first-class models.
- [ ] `PAY-008` Partial refund and maximum-refundable invariant enforced.
- [ ] `PAY-009` Transaction pinned to provider config; failover cannot double charge.
- [ ] `PAY-010` Raw PAN/CVV never enters our systems.
- [ ] `PAY-011` Provider capability/configuration includes statement descriptor behavior and consumer support identification.
- [ ] `PAY-012` Descriptor/provider/portfolio facts are snapshotted and shown accurately on checkout/receipt without deceptive privacy claims.

## H. Ledger and reconciliation

- [ ] `LEDGER-001` Append-only double-entry journal implemented.
- [ ] `LEDGER-002` SQL/test invariant guarantees balanced entries per currency.
- [ ] `LEDGER-003` Capture/fees/reserve/release/refund/chargeback/payout/reversal scenarios tested.
- [ ] `LEDGER-004` Available/pending/reserved/paid are derived projections with as-of time.
- [ ] `LEDGER-005` Transaction snapshots preserve fee/policy/provider/trust/jurisdiction facts.
- [ ] `LEDGER-006` Daily/on-demand reconciliation framework and source hashes implemented.
- [ ] `LEDGER-007` Reconciliation breaks create cases; no balance overwrite.
- [ ] `LEDGER-008` Manual adjustments are compensating, reasoned, and dual-controlled at threshold.
- [ ] `LEDGER-009` Money uses integer minor units; USD-only policy enforced.
- [ ] `LEDGER-010` Reserve is never treated as revenue.

## I. Concurrency and jobs

- [ ] `REL-001` Domain + audit + ledger + outbox commit atomically.
- [ ] `REL-002` Financial transitions use row locks/version checks and invalid transitions reject.
- [ ] `REL-003` Outbox worker supports leases, idempotency, retry/backoff/jitter, dead letter, audited replay.
- [ ] `REL-004` Worker crash/retry scenarios do not duplicate side effects.
- [ ] `REL-005` Dependency timeout/circuit behavior produces honest pending/outage states.
- [ ] `REL-006` Queue age/dead letters are monitored.

## J. Trust, risk, and reviews

- [ ] `TRUST-001` Trust algorithm is deterministic, versioned, confidence-aware, and snapshotted.
- [ ] `TRUST-002` Publication thresholds prevent misleading low-sample metrics.
- [ ] `TRUST-003` Trust cannot be purchased/manually marketed.
- [ ] `RISK-001` Risk decisions are versioned, explainable internally, expiring, and auditable.
- [ ] `RISK-002` Public trust never directly authorizes payout.
- [ ] `RISK-003` Payout destination/recovery/security changes trigger cooldown/review.
- [ ] `RISK-004` Limits/holds/velocity/linked-account rules are tested.
- [ ] `TRUST-004` One eligible transaction allows at most one review.
- [ ] `TRUST-005` Self/collusive/reversed transaction controls affect aggregation audibly.
- [ ] `TRUST-006` Review report/moderation/appeal exists.

## K. Security and PCI-oriented controls

- [ ] `SEC-001` ASVS/API threat-model mapping exists.
- [ ] `SEC-002` CSP/HSTS/nosniff/referrer/permissions/cache headers tested.
- [ ] `SEC-003` Private data excluded from shared Next.js/CDN/service-worker caches.
- [ ] `SEC-004` CSRF, XSS, SQLi, SSRF, mass assignment, IDOR, replay, and rate-limit tests pass.
- [ ] `SEC-005` Checkout third-party script inventory/change controls exist.
- [ ] `SEC-006` No unapproved scripts on checkout.
- [ ] `SEC-007` Secrets are validated, least privilege, rotatable, and absent from repo/build/logs.
- [ ] `SEC-008` Critical dependency/container/source scans pass or have approved risk acceptance.
- [ ] `SEC-009` Admin, webhook, auth, and payment routes have body/content-type/rate limits.
- [ ] `SEC-010` Independent security review completed before live money.

## L. UX, accessibility, and browser quality

- [ ] `UX-001` Design tokens/components are consistent and intentionally minimal.
- [ ] `UX-002` Every core screen has loading/empty/error/outage/restricted/stale states.
- [ ] `UX-003` No hydration flash/layout shift/double financial submit/keyboard obstruction.
- [ ] `UX-004` Terminology is consistent and protection/anonymity claims are bounded.
- [ ] `ACC-001` WCAG 2.2 AA automated checks pass.
- [ ] `ACC-002` Critical flows manually keyboard/screen-reader tested.
- [ ] `ACC-003` Zoom/reflow/focus/reduced motion/touch targets pass.
- [ ] `UX-005` Playwright visual snapshots reviewed at mobile/desktop/long-text widths.
- [ ] `UX-006` WebKit/Chromium/Firefox and installed-PWA behavior tested.
- [ ] `PERF-001` Web Vitals and backend/worker budgets measured and within target or documented.

## M. Observability and operations

- [ ] `OPS-001` Structured redacted logs, traces, metrics, correlations exist.
- [ ] `OPS-002` Dashboards/alerts cover checkout/provider/webhook/jobs/reconciliation/payout/auth/T&S.
- [ ] `OPS-003` Every paging alert has owner/runbook.
- [ ] `OPS-004` Immutable audit events exist for privileged and financial/security actions.
- [ ] `OPS-005` Ops case views and RBAC are implemented.
- [ ] `OPS-006` Support authentication never uses order code alone.
- [ ] `OPS-007` Privacy-safe versioned email templates and bounce/suppression handling exist.
- [ ] `OPS-008` Required kill switches work and are tested.
- [ ] `OPS-009` Legal/IP/child-safety/privacy/sanctions cases preserve evidence, access history, escalation owner and applicable legal hold without exposing restricted data broadly.

## N. Release engineering and resilience

- [ ] `REL-007` Migration from previous schema and application rollback path tested.
- [ ] `REL-008` Backfills are resumable/idempotent/observable.
- [ ] `REL-009` SBOM/provenance/release dossier generated.
- [ ] `REL-010` Local/test/staging/prod separation and typed config validated.
- [ ] `REL-011` Backup/PITR plan and restore exercise documented before live launch.
- [ ] `REL-012` Incident severity, payment-stop, payout-hold, provider-outage, ATO, privacy, migration, and key-rotation runbooks exist.
- [ ] `REL-013` Vendor register and termination/export/fallback plan exist.
- [ ] `REL-014` Production deployment is immutable, health checked, observable, and rollback capable.

## O. Live external gates — cannot be self-approved by Grok

- [ ] `LIVE-001` Processor/acquirer approves exact adult creator platform and external delivery in writing. `BLOCKED_EXTERNAL`
- [ ] `LIVE-002` Merchant/submerchant/funds-flow diagram and contract approved. `BLOCKED_EXTERNAL`
- [ ] `LIVE-003` State/federal payments analysis and launch-state allowlist approved by counsel. `BLOCKED_EXTERNAL`
- [ ] `LIVE-004` Adult/card-network/age/identity/consent responsibilities approved. `BLOCKED_EXTERNAL`
- [ ] `LIVE-005` Actual fees, reserves, ticket/volume limits, refund/chargeback allocation, and payout rails signed. `BLOCKED_EXTERNAL`
- [ ] `LIVE-006` KYC/age/email/hosting vendor AUPs accept the business. `BLOCKED_EXTERNAL`
- [ ] `LIVE-007` Buyer-protection, creator agreement, AUP, privacy, dispute, and review policies approved. `BLOCKED_EXTERNAL`
- [ ] `LIVE-008` PCI scope/SAQ and checkout architecture validated by provider/acquirer/assessor. `BLOCKED_EXTERNAL`
- [ ] `LIVE-009` Provider sandbox adapter and reconciliation suite pass. `BLOCKED_EXTERNAL` until credentials.
- [ ] `LIVE-010` Independent penetration test and remediation complete. `BLOCKED_EXTERNAL` until release candidate.
- [ ] `LIVE-011` Operational staffing/escalation and processor support path ready. `BLOCKED_EXTERNAL`
- [ ] `LIVE-012` Named human go-live approval recorded. `BLOCKED_EXTERNAL`
- [ ] `LIVE-013` Seller/PSE, creator tax reporting/withholding, sales/use tax, revenue recognition, and dormant/unclaimed-funds responsibilities are approved by provider and qualified tax/accounting counsel. `BLOCKED_EXTERNAL`
- [ ] `LIVE-014` Sanctions/OFAC, PEP, AML/transaction-monitoring and escalation responsibilities are contractually allocated and operationalized. `BLOCKED_EXTERNAL`
- [ ] `LIVE-015` Section 2257/2257A, child-safety/CyberTipline reporting, IP/DMCA and evidence-preservation obligations are approved for the non-hosting model. `BLOCKED_EXTERNAL`
- [ ] `LIVE-016` Statement descriptor, buyer receipt/contact, pricing, refund and protection disclosures are approved in the selected merchant portfolio. `BLOCKED_EXTERNAL`
- [ ] `LIVE-BRAND-001` Exact `Paid` App Store name is reserved or a documented metadata fallback is approved. `BLOCKED_EXTERNAL`
- [ ] `LIVE-BRAND-002` Trademark/common-law clearance for payment/software services is completed. `BLOCKED_EXTERNAL`
- [ ] `LIVE-BRAND-003` Production domain and anti-phishing/typosquatting plan are approved. `BLOCKED_EXTERNAL`
- [ ] `LIVE-BRAND-004` Google Play/publisher conflict review is completed. `BLOCKED_EXTERNAL`
- [ ] `LIVE-BRAND-005` Provider-approved descriptor/support identity aligns with the final brand. `BLOCKED_EXTERNAL`

