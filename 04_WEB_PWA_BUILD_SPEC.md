# 04 — Web/PWA Implementation Specification

**Version:** 2.2  
**Scope:** Complete provider-agnostic V1 using deterministic mock adapters; architect provider sandbox/live integration without fabricating it.

---

## 1. Frozen implementation stack

Use exact stable versions pinned in `package.json` and `pnpm-lock.yaml`:

- **Runtime:** Node.js 24 LTS.
- **Framework:** Next.js 16.3.3 or later patched 16.x, App Router, Node runtime for payment/auth/webhook/ops routes.
- **UI:** React version required by the chosen Next.js 16.x release.
- **Language:** TypeScript strict.
- **Workspace:** pnpm workspaces. Do not add Turborepo unless measured build orchestration requires it.
- **Database:** PostgreSQL 18.x latest supported patch.
- **Data access:** Drizzle ORM plus explicit SQL migrations/constraints.
- **Authentication:** Better Auth 1.6+ with Drizzle adapter, magic-link plugin, and passkey plugin.
- **Validation:** Zod.
- **Styling:** CSS Modules and `packages/ui/tokens.css`; no default shadcn/component-theme output.
- **Logs:** Pino-compatible structured logger with redaction.
- **Telemetry:** OpenTelemetry traces and metrics.
- **Tests:** Vitest, fast-check, Playwright, axe-core.
- **Local services:** Docker Compose PostgreSQL; optional local email catcher only for development.

Do not use prerelease/canary packages. Run an official-currentness/security check before locking versions. Node.js production must remain on an LTS line.

---

## 2. Applications

### `apps/web`

Public creator trust page, transaction link, guest receipt/status, creator dashboard/account/security.

### `apps/ops`

Separate staff surface with separate session policy, RBAC, strict cache controls, and no indexing.

### `apps/worker`

Transactional outbox, email dispatch, trust recalculation, provider polling stubs, reconciliation, retention/deletion jobs, and dead-letter handling.

Do not run critical background work inside a request lifecycle or a platform cron without a durable job record.

---

## 3. Package boundaries

```text
/packages
  auth
  authorization
  config
  contracts
  db
  domain
  payments-core
  payments-mock
  provider-simulator
  identity-core
  identity-mock
  email-core
  email-mock
  ledger
  reconciliation
  trust
  risk
  compliance
  audit
  observability
  ui
  test-support
```

Each package exports a narrow API and has independent tests. Cyclic imports are prohibited.

---

## 4. V1 route map

### Public/buyer

- `/c/[creatorHandle]`
- `/t/[transactionLinkId]`
- `/checkout/return/[provider]`
- `/guest/access/[token]` — scanner-safe GET interstitial; never consumes/authenticates.
- `/guest/access/[token]/continue` — user-initiated POST exchanges the token for a scoped cookie session and redirects to a clean URL.
- `/transaction/[publicOrderCode]`
- `/transaction/[publicOrderCode]/confirm`
- `/transaction/[publicOrderCode]/dispute`
- `/transaction/[publicOrderCode]/review`
- `/report`

### Creator

- `/creator/home`
- `/creator/create`
- `/creator/transactions`
- `/creator/transactions/[id]`
- `/creator/trust`
- `/creator/payouts`
- `/creator/account`
- `/creator/security`
- `/creator/sign-in`
- `/creator/onboarding`

### Ops

- `/ops/sign-in`
- `/ops/cases`
- `/ops/creators/[id]`
- `/ops/transactions/[id]`
- `/ops/disputes/[id]`
- `/ops/reconciliation`
- `/ops/risk`
- `/ops/compliance`
- `/ops/audit`
- `/ops/system`
- `/ops/system/provider-simulator` — local/test `PROVIDER_AGNOSTIC` only; production returns 404 and startup rejects accidental enablement.

Private routes explicitly opt out of shared caching. Ops app is never embedded in creator/public navigation.

---

## 5. Required canonical data model

At minimum:

- users
- creator_profiles
- creator_handles
- creator_verifications
- creator_compliance_checks
- creator_provider_accounts
- merchant_portfolios
- provider_capabilities
- policy_versions
- creator_agreement_acceptances
- payout_destinations
- transaction_links
- checkout_reservations
- transactions
- transaction_terms_snapshots (including fee/policy/provider/jurisdiction/descriptor snapshot)
- checkout_sessions
- payment_attempts
- payments
- provider_events_inbox
- provider_event_processing_attempts
- fulfillment_events
- internal_disputes
- internal_dispute_events
- network_disputes
- refunds
- reviews
- review_events
- trust_snapshots
- risk_decisions
- risk_appeals
- compliance_cases
- compliance_case_events
- external_compliance_decisions
- tax_reporting_statuses (provider/reference status only unless approved otherwise)
- payout_eligibility
- payouts
- ledger_accounts
- ledger_entries
- ledger_postings
- reconciliation_runs
- reconciliation_sources
- reconciliation_breaks
- outbox_jobs
- dead_letter_jobs
- idempotency_records
- guest_transaction_credentials
- audit_events
- feature_flag_changes
- statement_descriptor_snapshots
- tax_responsibility_decisions
- failed_payout_aging_cases
- retention_jobs

Use SQL constraints for integrity. Store transaction snapshots so historical terms cannot drift.

---

## 6. API style

Use typed command/query handlers with Zod and explicit authorization.

Examples:

- `POST /api/creator/transaction-links`
- `POST /api/transactions/:id/checkout-sessions`
- `POST /api/guest/exchange/continue` — deliberate scanner-safe token consumption; email-link `GET` never authenticates or mutates.
- `POST /api/transactions/:id/mark-delivered`
- `POST /api/guest/transactions/:id/confirm`
- `POST /api/guest/transactions/:id/disputes`
- `POST /api/guest/transactions/:id/reviews`
- `POST /api/provider/webhooks/:provider`
- `POST /api/ops/disputes/:id/resolve`
- `POST /api/ops/payouts/:id/hold`
- `POST /api/ops/reconciliation/:id/resolve-break`

Generate an internal OpenAPI contract. Mutations require explicit command schemas; never expose generic table CRUD.

---

## 7. Authentication implementation

### Creator

- email magic link with hashed, atomic single-use token and scanner-safe GET -> user-initiated POST exchange;
- passkey enrollment after first verified session;
- passkey sign-in/conditional UI where supported;
- session list and revocation;
- step-up/fresh session for email, identity, payout destination, recovery, and financial actions;
- no password by default.

### Guest buyer

- high-entropy bearer URL is stored hashed;
- GET renders a scanner-safe, zero-third-party interstitial without consuming/authenticating;
- user-initiated POST atomically consumes/validates it and sets a transaction-scoped HttpOnly cookie;
- redirect immediately to a clean transaction URL;
- token can be revoked/reissued;
- risky actions may require emailed verification.

### Ops

- separate staff role assignment;
- phishing-resistant MFA/passkey;
- short/fresh session requirements;
- no shared accounts or default impersonation.

---

## 8. Provider adapters

Implement:

```ts
interface PaymentProviderAdapter {
  readonly name: string;
  readonly adapterVersion: string;
  getCapabilities(input: ProviderCapabilityContext): Promise<ProviderCapabilities>;
  createCreatorOnboarding(input: CreateCreatorOnboardingInput): Promise<OnboardingSession>;
  getCreatorComplianceStatus(providerCreatorId: string): Promise<ComplianceStatus>;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  getPayment(providerPaymentId: string): Promise<ProviderPayment>;
  createRefund(input: CreateRefundInput): Promise<ProviderRefund>;
  getRefund(providerRefundId: string): Promise<ProviderRefund>;
  getNetworkDispute(providerDisputeId: string): Promise<ProviderDispute>;
  setPayoutRestriction?(input: PayoutRestrictionInput): Promise<void>;
  getPayout(providerPayoutId: string): Promise<ProviderPayout>;
  verifyAndNormalizeWebhook(rawBody: Uint8Array, headers: Headers): Promise<VerifiedProviderEvent>;
  fetchReconciliation(input: ReconciliationRequest): Promise<ProviderReconciliationBatch>;
}
```

Also implement identity/age/email adapters and mocks.

`payments-mock` must model pending, success, failure, duplicate event, delayed event, out-of-order event, refund, chargeback, payout failure, provider outage, webhook-key rotation, checkout-reservation expiry, and a late provider success after local timeout.

`provider-simulator` exposes deterministic named scenarios through a CLI and local/test-only ops control surface. It uses the injected fake clock and fixed seeds, records emitted events, and is structurally unavailable in production.

---

## 9. Background processing

Use PostgreSQL transactional outbox and `apps/worker`.

Every job has:

- type/version;
- payload schema;
- idempotency/deduplication key;
- available time;
- attempt count/max attempts;
- lease/lock metadata;
- last error code;
- completed/dead-letter time.

Worker uses safe concurrent claiming. Jobs retry with bounded backoff/jitter and move to dead letter with alert. Operator replay is audited.

---

## 10. Build sequence

### Milestone 0 — governance/preflight

- `AGENTS.md` and docs register;
- build status, assumptions, spec gaps, traceability;
- threat model;
- data register;
- authorization matrix;
- state diagrams;
- standards register;
- ADR skeletons.

### Milestone 1 — reproducible foundation

- pnpm workspace;
- Next.js web/ops + worker;
- strict TS/lint/format;
- Docker Compose Postgres;
- Drizzle schema/migrations;
- config validation;
- logs/OTel;
- CI;
- UI tokens/primitives;
- synthetic seed.

### Milestone 2 — authentication and creator onboarding shell

- Better Auth magic link/passkey;
- creator account/security/session views;
- mock identity verification state;
- public pseudonym/handle protection;
- agreement acceptance versioning;
- typed external compliance/tax/sanctions statuses with deterministic mock states; no invented live rules.

### Milestone 3 — creator/public product

- Home/Create/Transactions/Trust/Account;
- public creator page;
- transaction link creation/expiry/cancel;
- transaction snapshot including policy/provider/fee/jurisdiction/statement-descriptor/tax facts;
- immutable activated terms and single-use checkout reservation/concurrency;
- provider-authoritative paid-time deadline calculation;
- responsive/accessible states.

### Milestone 4 — guest privacy and mock checkout

- transaction page;
- compliance/limit decision;
- mock checkout session;
- scanner-safe bearer-token continuation and deliberate POST exchange to clean session;
- receipt/status with statement-descriptor snapshot;
- noindex/referrer/CSP/cache controls;
- optional account claim shell.

### Milestone 5 — fulfillment/protection/reviews

- creator delivery declaration;
- buyer confirmation;
- internal dispute case/timeline;
- review eligibility/moderation;
- trust snapshots/thresholds;
- email outbox.

### Milestone 6 — financial integrity/risk

- provider inbox/outbox;
- idempotency;
- canonical payment/refund/network-dispute/payout models;
- double-entry ledger;
- reconciliation framework;
- rules-based risk decisions with protected-characteristic prohibition and review/appeal;
- limits/holds;
- failed-payout/payable aging report;
- explicit zero-tax mock and typed tax-responsibility capability;
- kill switches.

### Milestone 7 — ops and reliability

- RBAC case UI;
- audit explorer;
- reconciliation breaks;
- manual dispute decision with dual control threshold;
- T&S/IP/legal/privacy/report case categories;
- external compliance decision register;
- dashboards/alerts;
- runbooks;
- backup/restore evidence;
- full E2E/property/security/accessibility/visual tests.

### Milestone 8 — selected provider sandbox

`BLOCKED_EXTERNAL` until approved ADR and credentials.

### Milestone 9 — live money

`BLOCKED_EXTERNAL` and cannot be approved by Grok.

---

## 11. Required local commands

The completed repository must provide stable scripts equivalent to:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:property
pnpm test:contract
pnpm test:integration
pnpm test:migrations
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
pnpm test:security
pnpm test:load
pnpm mock:scenario -- --name happy-path
pnpm sbom
pnpm build
pnpm verify
```

`pnpm verify` runs every non-live release gate that can be automated.

---

## 12. Deployment boundary

Provider-independent build must be container-ready and cloud-portable. Do not deploy production or create live infrastructure without the user selecting a host/environment and approving secrets/costs.

Before live launch require:

- managed Postgres PITR;
- TLS/custom domain;
- secret manager/KMS;
- separate web/ops/worker scaling;
- durable scheduled reconciliation;
- backup restore test;
- monitoring/alert destinations;
- SPF/DKIM/DMARC for transactional email;
- IaC/config record;
- processor production approval;
- approved statement descriptor and buyer disclosure;
- sales/use-tax and marketplace-facilitator responsibility determination;
- unclaimed-property/escheatment treatment for failed payouts and creator payables.

---

## 13. Prototype use

`prototype/` is a visual behavior reference only. Do not copy its mock payment logic, security model, or data handling into production code. Preserve its simplicity while rebuilding production components from the specifications.
