# 03 — Grok Build Bible / Engineering Constitution

**Version:** 2.0 — final pre-provider build standard  
**Status:** Authoritative for the provider-agnostic V1 build  
**Primary objective:** Build the complete non-live-money product in one autonomous execution, while keeping provider-, legal-, and underwriting-dependent behavior behind explicit adapters and gates.

---

## 0. Mission and definition of “one go”

You are the implementation organization for a financial/trust product handling sensitive identity, adult-adjacent commerce, creator payouts, buyer protection, disputes, reviews, and public reputation.

“One go” means:

1. read all governing documents;
2. inspect the repository and environment;
3. resolve every reversible implementation decision using this Bible;
4. record genuine external blockers rather than asking the user to restate known requirements;
5. design, implement, test, audit, and document every provider-independent V1 milestone;
6. continue fixing defects until all non-blocked release gates pass;
7. deliver a runnable repository plus evidence, not merely generated code or a visual mockup.

“One go” does **not** mean pretending that unknown processor contracts, legal opinions, production credentials, or underwriting decisions are known. Those remain `BLOCKED_EXTERNAL`, while the rest of the product must still be completed.

Do not stop after scaffolding, the first successful build, or the happy path. Do not declare success because pages render.

---

## 1. Authority, precedence, and build modes

### 1.1 Document precedence

When instructions conflict, use this order:

1. signed processor/acquirer contract and official integration documentation;
2. written legal/compliance decisions recorded in an approved ADR;
3. `01_V1_PRODUCT_UX_SPEC.md`;
4. `09_IMPLEMENTATION_DECISION_LOCK.md` for explicitly locked implementation choices;
5. this Bible;
6. `04_WEB_PWA_BUILD_SPEC.md`;
7. `10_RELEASE_ACCEPTANCE_MATRIX.md`;
8. `11_ACCEPTANCE_TEST_MATRIX.md`;
9. existing repository conventions that do not conflict with the above;
10. implementation judgment.

Never let a framework default override a product, privacy, financial, or security requirement.

### 1.2 Build modes

The codebase must support three explicit modes:

#### `PROVIDER_AGNOSTIC`
Current mode. Uses mock adapters and synthetic fixtures. No live card data, KYC, age checks, settlement, refunds, or payouts.

#### `PROVIDER_SANDBOX`
Enabled only after `ADR-001-payment-provider.md` documents the selected provider, canonical status mapping, approved merchant structure, sandbox credentials, and compliance responsibilities.

#### `PRODUCTION_MONEY`
Enabled only after every `LIVE-*` gate in the release matrix is approved. Production money features must fail closed if configuration is absent or inconsistent.

Mode must be server-controlled and visible in diagnostics. A client request cannot select or override it.

### 1.3 Decision classifications

Use exactly:

- `REQUIREMENT` — explicitly mandated.
- `DECISION` — reversible technical choice made from this Bible.
- `ASSUMPTION` — temporary, documented, testable assumption.
- `SPEC_GAP` — requirement ambiguity that cannot safely be inferred.
- `BLOCKED_EXTERNAL` — processor/legal/credential decision outside the repository.
- `RISK_ACCEPTANCE_REQUIRED` — known release risk needing named approval.

For a reversible implementation detail, proceed and record a `DECISION`. For anything that can move money, reveal sensitive identity, weaken compliance, or alter legal responsibility, fail closed and record `BLOCKED_EXTERNAL` or `SPEC_GAP`.

---

## 2. Current standards baseline

Use these as verification baselines and record exact versions in `docs/standards-register.md`:

- OWASP ASVS 5.0.0, using Level 2 as the web-application baseline and selected Level 3 controls for admin, payout, identity, and financial functions.
- OWASP API Security Top 10 2023 and OWASP Top 10 2025.
- NIST SP 800-63-4 family for identity proofing, authentication, recovery, and authenticator lifecycle.
- NIST SP 800-218 SSDF 1.1 as the stable secure-development baseline; track the 1.2 draft but do not label draft guidance mandatory without an ADR.
- NIST SP 800-61 Rev. 3 for incident-response preparation, detection, response, recovery, and learning.
- PCI DSS v4.0.1 and the selected processor/acquirer’s current e-commerce guidance.
- WCAG 2.2 Level AA.
- SLSA v1.1 concepts for build provenance and software-supply-chain integrity where practical.

Standards are not checkbox decoration. Translate applicable controls into repository requirements and tests. Do not claim formal certification unless an authorized assessor has actually certified it.

---

## 3. Frozen provider-independent V1 decisions

Unless superseded by an approved ADR:

- Web/PWA first; no native app dependency.
- US-only beta, limited to a server-side jurisdiction allowlist approved later.
- USD only in V1. Store ISO currency on every amount anyway.
- English (`en-US`) only at launch, but strings and date/number formatting must be localization-ready.
- No subscriptions.
- No tips in V1.
- No catalog, feed, discovery marketplace, followers, DMs, livestreaming, or creator posts.
- No adult-content hosting, previews, in-app delivery, evidence-media uploads, or general file uploads.
- No arbitrary P2P transfers, buyer balances, creator spendable wallets, stored value, or cross-user transfers.
- One creator/seller per transaction; no split sellers or multi-party settlement.
- Buyer account is optional; creator account is required.
- Buyer is anonymous to the creator by default, not anonymous to the processor/platform where compliance or risk requires data.
- Email is the only required notification channel in V1. SMS and push are deferred.
- No automatic commercial completion until the applicable policy/provider decision exists. Mock mode may simulate buyer confirmation.
- No startup-financed instant payout.
- No real processor, KYC, age, sanctions, or payout integration until its adapter gate is approved.
- No Apple Pay or Google Pay assumption for adult transactions.
- No user-controlled custom payment domains.
- No server fetching of arbitrary user-provided external URLs.

These decisions exist to eliminate hidden scope and make autonomous implementation deterministic.

---

## 4. Exact technical baseline

Use the exact stack in `04_WEB_PWA_BUILD_SPEC.md`. At this version of the Bible, the default is:

- Node.js 24 LTS, not a Current/EOL release.
- Next.js 16.3.3 or a later fully patched 16.x release, pinned exactly in the lockfile.
- React 19.2-compatible version required by the pinned Next.js release.
- TypeScript with all strictness options enabled.
- pnpm workspace; no npm/yarn lockfile alongside it.
- PostgreSQL 18.x on the latest supported security patch available to the environment.
- Drizzle ORM for typed access plus explicit SQL migrations and SQL-level constraints.
- Better Auth 1.6+ self-hosted with magic-link and passkey plugins, subject to security review.
- Zod for runtime input/output/configuration schemas.
- CSS Modules + a small global token system; no default component-theme kit.
- Pino-compatible structured logging with mandatory redaction.
- OpenTelemetry for traces and metrics; do not depend on experimental OTel logging for the only copy of logs.
- Vitest, Playwright, axe-core, and fast-check or an equivalent property-testing library.
- Docker Compose for local Postgres and reproducible local development.

No prerelease, canary, beta, RC, or `latest` dependency is allowed in committed production manifests. If a security advisory requires an urgent patch, update to the fixed stable version and record it.

---

## 5. Required repository shape

```text
/apps
  /web                  # public buyer + creator PWA
  /ops                  # staff operations app, separate route/session boundary
  /worker               # outbox/jobs/reconciliation/background processing
/packages
  /auth                 # Better Auth config, passkey/magic-link policy
  /config               # validated environment and feature gates
  /db                   # schema, migrations, constraints, transaction helpers
  /domain               # canonical entities, value objects, state machines
  /authorization        # actor/context policies and safe DTOs
  /payments-core        # canonical interfaces and normalized provider events
  /payments-mock        # deterministic mock provider
  /identity-core        # KYC/age/provider adapter contracts
  /identity-mock
  /email-core
  /email-mock
  /ledger               # balanced journal and projections
  /reconciliation
  /trust
  /risk
  /compliance
  /audit
  /observability
  /ui                   # tokens and deliberately small reusable primitives
  /test-support         # fixtures, builders, fake clock, provider event corpus
/docs
  /adr
  /runbooks
  /threat-models
  /requirements
  /standards
  BUILD_STATUS.md
  ASSUMPTIONS.md
  SPEC_GAPS.md
  traceability.md
```

A package owns its tables and write services. Other packages may use its public interface, not update its data directly.

---

## 6. Autonomous work protocol

### Phase A — preflight

Before implementation:

1. inventory files, packages, scripts, versions, and existing failures;
2. confirm build mode;
3. validate that no production credentials or user data are present;
4. copy/adapt the repository `templates/` and create or update `BUILD_STATUS.md`, `ASSUMPTIONS.md`, `SPEC_GAPS.md`, and `traceability.md`;
5. produce architecture and data-flow diagrams in Mermaid or text;
6. create the initial threat model and data-classification register;
7. define all state machines and financial invariants before persistence code;
8. define adapter contracts before provider-specific code;
9. create a milestone task ledger with requirement IDs.

### Phase B — vertical implementation

Build in complete vertical slices. Each slice includes:

- database schema and migration;
- domain rule;
- authorization;
- API/command handler;
- UI states;
- audit event;
- observability;
- tests;
- failure handling;
- documentation.

Do not build all UI first and postpone security/financial correctness.

### Phase C — continuous verification

After every slice:

- run format, lint, typecheck, unit, integration, and relevant E2E tests;
- inspect database constraints and migration output;
- test unauthorized actors;
- exercise retries, duplicates, stale state, and interruption;
- inspect mobile UX and accessibility;
- update traceability status.

### Phase D — adversarial review

Run separate reviews that assume the implementation is wrong:

- payment/ledger reviewer;
- authorization/privacy reviewer;
- fraud/abuse reviewer;
- authentication/account-recovery reviewer;
- UI/jank/accessibility reviewer;
- reliability/operations reviewer;
- supply-chain/dependency reviewer.

The authoring pass may not waive defects discovered by a reviewer pass.

### Phase E — completion loop

Continue implementing and fixing until every non-external acceptance item is `VERIFIED`. A final answer that only lists future tasks is not completion.

---

## 7. Requirements traceability and evidence

Use IDs:

- `PROD-*` product
- `UX-*` interaction/content design
- `AUTH-*` authentication/session/recovery
- `AUTHZ-*` authorization/tenant isolation
- `PRIV-*` privacy/data governance
- `SEC-*` application/infrastructure security
- `COMP-*` compliance/jurisdiction/policy
- `PAY-*` processor/payment state
- `LEDGER-*` financial journal/reconciliation
- `RISK-*` fraud/payout risk
- `TRUST-*` public reputation/reviews
- `OPS-*` staff operations/support
- `REL-*` reliability/incident/DR
- `PERF-*` performance
- `ACC-*` accessibility
- `TEST-*` verification
- `LIVE-*` external production-money gates

`docs/traceability.md` must map:

`requirement -> implementation -> automated tests -> manual evidence -> status -> blocker/owner`.

Allowed statuses:

- `VERIFIED`
- `IMPLEMENTED_BUT_UNVERIFIED`
- `PARTIALLY_VERIFIED`
- `FAILED`
- `BLOCKED_EXTERNAL`
- `NOT_APPLICABLE`

Never treat “not testable here” as passed.

---

## 8. Actors, tenancy, and authorization

### 8.1 Actors

- unauthenticated public visitor;
- guest buyer with transaction-scoped session;
- registered buyer;
- creator;
- Support operator;
- Disputes operator;
- Risk/Fraud operator;
- Compliance/Trust & Safety operator;
- Payments/Reconciliation operator;
- Security administrator;
- system worker;
- provider webhook identity.

### 8.2 Deny-by-default

Every command and query must declare allowed actors and object scope. UI visibility is not authorization.

Authorization must check:

- actor type;
- account status;
- object ownership or assigned case scope;
- creator/transaction relationship;
- required fresh/step-up session;
- jurisdiction/compliance state;
- feature gate/build mode;
- expected record version when mutating.

### 8.3 Tenant isolation

Creator-owned records carry `creator_id`. Cross-creator access must be impossible through ID changes, search, pagination, exports, logs, or cached data.

Use explicit actor-safe DTO schemas:

- `PublicCreatorDTO`
- `CreatorTransactionDTO`
- `GuestTransactionDTO`
- `SupportCaseDTO`
- `RiskCaseDTO`
- `ComplianceCaseDTO`

Never serialize a database row and remove fields afterward. Construct allowlisted output objects.

### 8.4 Staff access

- No universal production staff role.
- No silent admin impersonation.
- Any break-glass access requires a reason, short expiration, alert, and immutable audit event.
- Extraordinary refunds, ledger adjustments, payout releases, or restriction overrides require dual control where technically supported.
- Staff sessions require stronger authentication than consumer sessions.

Create an authorization matrix and automated negative tests for every sensitive route.

---

## 9. Data modeling and transaction snapshots

### 9.1 IDs

Use random opaque IDs (UUIDv7/ULID or equivalent) internally. Public order codes are non-secret secondary identifiers. Secret transaction credentials are separate.

Normalize creator handle slugs, reserve system/brand-confusable names, and defend against Unicode homograph/impersonation abuse. Store display name separately from canonical handle.

### 9.2 Money

- integer minor units only;
- ISO 4217 currency on every amount;
- V1 allows `USD` only through policy validation;
- no JavaScript floating-point arithmetic for money;
- define rounding once and test it;
- prohibit negative input amounts unless represented as a ledger adjustment type;
- min/max ticket limits are server configuration, versioned and provider-aware.

### 9.3 Dates and clocks

- Store UTC instants.
- Store intended deadline timezone or an absolute deadline calculated server-side.
- Use a fake/injectable clock in domain tests.
- Do not trust browser clocks.
- Account for clock skew in token/webhook replay windows.

### 9.4 Transaction snapshot

A transaction must snapshot facts that must not change retroactively:

- creator public identity shown at purchase;
- transaction category and permitted terms;
- adult/non-adult lane;
- final buyer amount;
- currency;
- fee schedule version and estimated deductions;
- buyer-protection policy version;
- creator agreement version relevant to sale;
- delivery deadline and timezone basis;
- processor/provider configuration ID;
- merchant/submerchant/provider creator ID;
- jurisdiction policy version;
- public trust snapshot ID displayed to buyer.

Editing a creator profile, fee schedule, or legal policy later must not rewrite the historical sale.

### 9.5 Constraints

Financial and integrity invariants require database constraints in addition to application validation:

- unique provider event IDs;
- one eligible canonical review per transaction;
- one active payout destination per creator where policy requires;
- non-negative gross payment amount;
- balanced ledger entry enforcement;
- valid state values;
- foreign keys with deliberate delete behavior;
- unique public order code;
- unique idempotency key scope;
- version column for optimistic concurrency where used.

### 9.6 Deletion and retention

Do not confuse account closure, user-facing deletion, anonymization, and legal deletion. Implement a retention-policy table by data class and an auditable erasure/anonymization job. Legal holds suspend deletion for scoped records and must be auditable.

---

## 10. Canonical state machines

Do not model the entire transaction with one mutable status.

### 10.1 Creator onboarding

`DRAFT -> IDENTITY_PENDING -> PROCESSOR_PENDING -> COMPLIANCE_REVIEW -> ACTIVE`

Exceptional states:

`NEEDS_INFORMATION | RESTRICTED | SUSPENDED | REJECTED | CLOSED`

### 10.2 Transaction link

`DRAFT -> ACTIVE -> USED_OR_LIMIT_REACHED | EXPIRED | CANCELLED | DISABLED`

A link may have one transaction in V1. Reusable/generic links require a later ADR.

### 10.3 Checkout session

`CREATED -> PROVIDER_CREATED -> REDIRECTED_OR_RENDERED -> RETURNED | EXPIRED | FAILED`

A checkout return is not proof of payment. Provider-confirmed payment state is authoritative.

### 10.4 Payment

`CREATED -> AUTH_PENDING -> AUTHORIZED -> CAPTURED`

Exceptional:

`FAILED | VOIDED | CANCELLED | UNKNOWN_REQUIRES_RECONCILIATION`

Post-capture dimensions/events:

`PARTIALLY_REFUNDED | REFUNDED | CHARGEBACK_OPEN | CHARGEBACK_WON | CHARGEBACK_LOST`

Represent refund and network dispute as first-class entities; do not force mutually exclusive values into one enum.

### 10.5 Fulfillment

`AWAITING_DELIVERY -> CREATOR_MARKED_DELIVERED -> BUYER_ACCEPTED | DISPUTED`

`AUTO_ACCEPTED` is disabled until approved by policy ADR.

### 10.6 Internal buyer-protection dispute

`OPEN -> TRIAGED -> AWAITING_CREATOR -> AWAITING_BUYER | REVIEW -> BUYER_WON | CREATOR_WON | PARTIAL | WITHDRAWN | CLOSED`

Illegal/underage/non-consensual reports fork immediately into a Trust & Safety case and may restrict payment/payout independently.

### 10.7 Refund

`REQUESTED -> PROVIDER_PENDING -> SUCCEEDED | FAILED | CANCELLED`

Support partial refunds and multiple attempts without allowing total successful refund amount to exceed captured amount.

### 10.8 Payout

`NOT_ELIGIBLE -> POLICY_HOLD | RISK_HOLD | COMPLIANCE_HOLD | ELIGIBLE -> SCHEDULED -> IN_TRANSIT -> PAID | FAILED | REVERSED`

A payout reversal can occur after `PAID` and must produce ledger effects.

### 10.9 Review

`INELIGIBLE | ELIGIBLE -> SUBMITTED -> PENDING_MODERATION -> PUBLISHED | HIDDEN | REMOVED | APPEALED`

Aggregate inclusion is a separate flag/versioned decision.

### 10.10 Compliance case

`OPEN -> TRIAGE -> INVESTIGATING -> ACTION_REQUIRED | CLEARED | RESTRICTED | REPORTED | CLOSED`

Define legal transitions, guards, actor permissions, audit events, and side effects centrally. Generate state diagrams and table-driven transition tests.

---

## 11. Atomicity, concurrency, and background work

### 11.1 Database transactions

Any operation that changes domain state plus audit/ledger/outbox records must commit atomically in one database transaction.

Use row-level locking or optimistic version checks for financial/status transitions. Do not use read-modify-write without a conflict strategy.

### 11.2 Transactional outbox

Use a database transactional outbox for side effects:

1. domain mutation and outbox row commit together;
2. worker claims rows using safe concurrent locking;
3. side effect is idempotent;
4. success records delivery;
5. retries use exponential backoff with jitter;
6. poison jobs enter a dead-letter state and alert;
7. operators can replay safely with audit history.

Examples: email, trust recalculation, provider polling, reconciliation, analytics emission.

### 11.3 Provider event inbox

Provider events use an inbox table with raw hash/body reference, signature status, provider event ID, schema version, normalized event type, received/processed times, and processing outcome.

### 11.4 Retry policy

- Retry only operations known to be safe or protected by provider idempotency.
- Use bounded exponential backoff and jitter.
- Timeouts are explicit per dependency.
- Do not retry authentication/validation failures.
- Never blindly retry an unknown payment result; reconcile first.
- Circuit-break dependencies showing sustained failure while preserving safe read access.

### 11.5 Job correctness

Assume at-least-once execution. Make handlers idempotent. Use a fake clock and deterministic job fixtures. Monitor queue age, attempts, dead letters, and stuck leases.

---

## 12. Provider adapter and continuity boundary

### 12.1 Required adapters

- `PaymentProviderAdapter`
- `IdentityVerificationAdapter`
- `AgeAssuranceAdapter`
- `EmailProviderAdapter`
- optional `FraudSignalAdapter`

All have deterministic mock implementations.

### 12.2 Payment adapter responsibilities

At minimum:

- create creator/submerchant onboarding session;
- read creator compliance status;
- create one-time checkout session;
- retrieve payment truth;
- create/read refund;
- read network dispute;
- read provider settlement/payout state;
- apply payout restriction/release only if provider supports it;
- verify and normalize webhooks;
- retrieve reconciliation/report data.

### 12.3 Canonical normalization

Provider-specific enums and payloads never escape the adapter package. Store the provider raw event securely for audit, then normalize into a versioned canonical event.

Create contract fixtures for every known provider event, including unknown fields, missing optional fields, duplicates, reordering, and new event versions.

### 12.4 Provider pinning

Each transaction is pinned to one provider configuration. Never migrate an in-flight payment to a different provider by changing a global setting.

### 12.5 Failover

Provider failover means:

- stop new checkouts safely;
- preserve current transactions;
- continue status/reconciliation where possible;
- switch only new eligible transactions through an approved migration plan;
- export all provider IDs and financial records.

Do not build “automatic payment-provider failover” that could double charge buyers.

### 12.6 Termination/offboarding

Maintain data export and reconciliation capability independent of provider dashboards. Document reserve/settlement termination behavior when contract is known.

---

## 13. Webhooks and external callbacks

For every provider webhook:

1. accept raw bytes;
2. enforce route-specific body size and content type;
3. verify signature before trusting parsed fields;
4. enforce provider replay/timestamp window where available;
5. persist unique provider event ID and payload hash;
6. acknowledge duplicate delivery idempotently;
7. normalize event with adapter version;
8. transition state under DB transaction and lock/version check;
9. append ledger/audit/outbox records atomically;
10. return provider-required response promptly;
11. process noncritical effects asynchronously;
12. reconcile missing/out-of-order events against the provider API/report.

Webhook endpoint must have no browser session dependency and no CSRF mechanism that breaks provider calls. Authentication is the provider signature plus network controls where supported.

Never let “last event received wins” determine financial truth.

---

## 14. Idempotency and replay protection

Money-changing commands require idempotency:

- create checkout;
- capture if applicable;
- refund/partial refund;
- provider payout/release instruction;
- financial dispute resolution;
- manual adjustment.

Store:

- key hash;
- actor/scope;
- operation;
- normalized request hash;
- result reference;
- status;
- created/expiry time.

Rules:

- identical retry returns the original result;
- reused key with a different normalized request is rejected;
- expiry must exceed the realistic retry/reconciliation window;
- idempotency is enforced server-side, not by disabled buttons;
- provider idempotency key is derived/mapped consistently and persisted.

WebAuthn challenges, magic links, email-change links, and step-up tokens are single-purpose, bounded, high-entropy, and replay-protected.

---

## 15. Financial ledger and reconciliation

### 15.1 Journal

Implement append-only double-entry accounting. Every journal entry:

- has one currency;
- has balanced debits/credits;
- links to a source event and transaction when relevant;
- has an immutable entry ID and occurred/recorded timestamps;
- records the accounting rule version;
- cannot be edited or deleted.

Corrections use compensating entries.

### 15.2 Minimum account classes

- processor settlement receivable/clearing;
- creator payable;
- creator reserve liability;
- platform fee revenue;
- processor fee expense/pass-through;
- refund clearing;
- network dispute/chargeback clearing;
- chargeback loss or creator receivable/negative payable;
- payout clearing;
- manual adjustment suspense.

### 15.3 Required scenarios

Tests must post and reconcile:

- capture;
- platform fee;
- processor fee estimate/actual difference;
- reserve placement;
- reserve release;
- full refund before payout;
- partial refund;
- refund after payout;
- chargeback before payout;
- chargeback after payout;
- chargeback reversal/win;
- payout success;
- payout failure;
- payout reversal;
- negative creator balance;
- future-earnings offset;
- authorized manual adjustment.

### 15.4 Projections

“Available,” “pending,” “reserved,” and “paid” are derived projections with an `as_of` timestamp and source. Never store a single mutable balance as authority.

### 15.5 Reconciliation

Run at least daily in production and on demand in sandbox. Compare:

- provider captures;
- voids/refunds;
- provider fees;
- reserves;
- settlements;
- network disputes/chargebacks;
- creator payouts;
- bank/processor batch totals where available;
- internal journal/projections.

Reconciliation uses a defined cutoff/timezone, stores source file/report hashes, and creates explicit breaks. Manual resolution never overwrites history; it posts approved adjustments or fixes source mapping.

Unexplained financial break is a release/operations incident.

---

## 16. Fees, limits, reserves, and historical terms

- Preferred V1: creator-side take rate; buyer sees one final amount.
- Never add a surprise checkout fee.
- Fee schedules are versioned and snapshotted per transaction.
- Processor fees shown before settlement may be labeled estimates if the provider can change actual assessed fees.
- Reserve is a creator liability restriction, not platform revenue.
- Ticket, weekly, outstanding exposure, and payout limits are server-side policies and may be stricter than provider limits.
- The strictest applicable provider, compliance, risk, and platform limit wins.
- Partial refunds cannot exceed remaining refundable amount.
- A negative creator balance does not authorize an unapproved card/bank debit; recovery method is contract/provider controlled.

---

## 17. Compliance and jurisdiction policy engine

Build a versioned server-side policy decision service. It returns `ALLOW`, `DENY`, or `REVIEW`, with reason codes and policy version.

Checkout creation must evaluate:

- build mode;
- creator account/compliance status;
- processor creator/submerchant status;
- adult/non-adult lane;
- creator and buyer jurisdiction signals available under approved policy;
- transaction category;
- prohibited-use flags;
- ticket/velocity/volume limits;
- required buyer age-assurance status;
- required agreement/policy acceptances;
- sanctions/provider restrictions where allocated;
- provider availability;
- payout/compliance restrictions that also block new sales.

Fail closed on missing mandatory compliance state.

### 17.1 Jurisdiction

- Launch regions are an allowlist, not an implicit worldwide default.
- IP geolocation alone is not authoritative identity/location.
- Record which signals and policy version produced the decision.
- Do not expose sensitive risk/compliance reasoning to public clients.

### 17.2 Adult/non-adult segregation

Treat lanes as potentially different merchant configurations/MIDs, provider settings, accepted payment methods, onboarding controls, and legal requirements. Do not assume a transaction boolean is sufficient.

### 17.3 Agreement acceptance

Version and record acceptance for:

- creator agreement;
- acceptable/prohibited-use policy;
- buyer-protection terms;
- buyer transaction terms;
- privacy notice where acknowledgment is required;
- processor/card-network flow-down terms.

Record actor, version/hash, time, context, and evidence. Never retroactively mark a user as accepting changed terms.

### 17.4 Trust & Safety

Build case intake for:

- underage/CSAM concern;
- non-consensual content;
- trafficking/prostitution/compensated offline sexual services;
- impersonation/stolen content;
- fraud/transaction laundering;
- harassment/review abuse;
- legal request.

Cases can immediately disable links, block new checkout, hold payouts where authorized, preserve evidence, and alert designated staff. Reporting obligations remain `BLOCKED_EXTERNAL` until counsel defines them; the system must support auditable escalation without pretending to determine law.

### 17.5 No media uploads

V1 rejects file/media uploads everywhere. Text and approved metadata only. A future evidence-media system requires a separate ADR, threat model, legal review, isolated storage, access policy, moderation operations, retention schedule, and release gate.

### 17.6 External legal/compliance decision register

Create `docs/external-compliance-decisions.md` from the repository template. It must separately track ownership, source, review date, configuration impact, retention impact, and live gate for:

- federal and state money-transmission, escrow, agent-of-payee, and funds-control analysis;
- merchant/seller/merchant-of-record/payment-settlement-entity classification;
- creator tax information, information reporting, withholding, sales/use/transaction-tax responsibility, and unclaimed/dormant-funds responsibility;
- sanctions/OFAC, PEP, AML/transaction-monitoring, and suspicious-activity responsibility as allocated among platform/provider/acquirer;
- adult/card-network registration, identity, age, consent, content-control, and complaint/appeal responsibilities;
- Section 2257/2257A analysis and record responsibility;
- child-safety/CyberTipline or other mandatory-reporting classification and escalation;
- DMCA/intellectual-property notice, repeat-infringer, and evidence-preservation responsibilities;
- state privacy/biometric/age-assurance requirements;
- statement descriptor, consumer contact, receipt, pricing, refund, and buyer-protection disclosures.

In `PROVIDER_AGNOSTIC` mode, implement typed statuses, mock decisions, case categories, audit trails, configuration schemas, and fail-closed gates. Do not encode a legal conclusion that has not been approved.

---

## 18. Privacy engineering and data governance

### 18.1 Data classes

Maintain `docs/data-register.md` with at least:

- Public
- Internal
- Confidential
- Sensitive PII
- Highly Sensitive Identity/Biometric
- Payment-reference data
- Adult-transaction sensitive inference
- Fraud/security telemetry
- Legally retained/audited financial data

For every field: purpose, source, processor, storage, encryption, access roles, retention, deletion/anonymization, export, and logging rule.

### 18.2 Identity minimization

Prefer verification-provider reference, status, assurance method/level, timestamps, country/age eligibility, and expiry/recheck indicators. Do not copy raw government ID or selfie unless a written requirement exists.

### 18.3 Buyer anonymity

Creator-facing APIs use allowlisted DTOs. The creator never receives cardholder/billing/legal identity, raw IP/device data, receipt email, fraud score, or transaction access credential.

### 18.4 Sensitive adult linkage

A record connecting a person/contact/payment signal to an adult transaction is highly sensitive. Segregate access, minimize free text, avoid broad staff search, and prohibit exporting it into general analytics/support tools.

### 18.5 Tokens and links

- Generate secrets with cryptographically secure randomness.
- Store only a keyed hash/digest of bearer/magic transaction tokens where feasible.
- On first successful URL-token use, exchange it for an HttpOnly, Secure, SameSite session cookie and redirect to a clean URL.
- Never persist token plaintext in logs, analytics, error reports, screenshots, or referrers.
- Support revoke/reissue.

### 18.6 Encryption and key management

- TLS everywhere.
- Managed database/storage encryption at rest.
- Application-layer/envelope encryption for the highest-sensitivity fields when retained.
- Keys live in a secret/KMS service, never the database/repository.
- Define key rotation and emergency rotation.
- Backups preserve encryption/security and are access controlled.

### 18.7 Privacy rights and account closure

Implement workflows for access/export, correction where appropriate, account closure, deletion/anonymization, and appeal/support. Financial/compliance records may be retained by policy, but public profile and unnecessary data must be removed on closure.

### 18.8 Retention and legal hold

Retention must be per data class and documented. Legal hold is scoped, authorized, auditable, and reversible. Deletion jobs produce evidence and retries.

### 18.9 Analytics and replay prohibition

No session-replay or heatmap scripts on checkout, receipt, KYC/age, payout, admin, dispute, or sensitive profile-management pages. Analytics events contain no raw email, legal name, transaction secret, payment token, device fingerprint, explicit description, or unnecessary order identifier.

---

## 19. Authentication, session, and recovery

### 19.1 Creator authentication

Use self-hosted Better Auth with:

- magic-link plugin as bootstrap/recovery path;
- passkey plugin as preferred ongoing sign-in;
- Drizzle/PostgreSQL adapter;
- server-side sessions;
- hashed single-use magic-link tokens;
- email enumeration protections;
- versioned secret rotation;
- device/session management UI.

Do not enable password login unless an ADR justifies it and password controls are implemented.

### 19.2 Passkeys

- correct production RP ID and trusted origins;
- HTTPS only outside localhost;
- random server challenges with expiry and single use;
- user-verification policy appropriate to creator/admin risk;
- list, name, and revoke passkeys;
- support more than one passkey before letting a user remove the last strong authenticator without recovery verification;
- account recovery must not silently bypass payout-security controls.

### 19.3 Sessions

- HttpOnly, Secure, SameSite cookies;
- session rotation after auth/privilege changes;
- server-side revocation;
- absolute and inactivity expiration;
- list/revoke device sessions;
- revoke all on high-risk recovery or suspected compromise;
- fresh/step-up session window for payout destination, identity, email, and extraordinary financial actions;
- no auth token in localStorage.

### 19.4 Email change and recovery

Email change verifies both old trusted channel (when available) and new address, sends security notification, revokes elevated sessions, and triggers payout-risk review/cooling period.

Recovery records reason, evidence, prior/new device, operator involvement, and resulting restrictions. A support agent cannot reset a high-value creator solely from knowledge-based questions.

### 19.5 Guest buyer access

Public order ID is not authorization. Guest access uses a transaction-scoped secret/session with least privilege. Support must not authenticate a buyer from an order code alone.

### 19.6 Staff authentication

Staff requires phishing-resistant MFA/passkey, short sessions, managed role assignment, no shared accounts, and stronger step-up for financial/compliance actions.

---

## 20. Web and API security

### 20.1 Security headers

Set and test, with route-specific exceptions only:

- strict Content Security Policy using nonces/hashes and restrictive `connect-src`, `frame-src`, `form-action`, and `frame-ancestors`;
- HSTS after production-domain readiness;
- `X-Content-Type-Options: nosniff`;
- restrictive `Referrer-Policy`;
- explicit `Permissions-Policy`;
- clickjacking protection through CSP;
- no wildcard CORS on authenticated APIs;
- secure cache-control on private/sensitive routes.

### 20.2 Next.js caching

Private, authenticated, guest-secret, payout, dispute, admin, and provider-return data must never enter a shared cache. Mark dynamic/private routes explicitly and test for cross-user cache leakage. Public trust profiles may be cached only with safe DTOs and explicit invalidation/versioning.

### 20.3 Input/output security

- runtime-validate all external input;
- reject unknown fields on money/security commands where safe;
- normalize Unicode where relevant;
- parameterized SQL only;
- contextual output encoding;
- sanitize permitted review text;
- request size limits;
- content-type checks;
- protect against mass assignment;
- never deserialize provider payloads directly into domain objects.

### 20.4 SSRF and external references

Do not fetch arbitrary creator/buyer URLs in V1. Treat URLs as opaque text after validation. Any future metadata fetcher must use an allowlist, DNS/IP rebinding defenses, egress controls, size/time limits, and an isolated worker.

### 20.5 Rate limits and automation abuse

Layered limits for:

- auth/magic link/passkey ceremonies;
- creator signup/link creation;
- checkout creation;
- transaction-token attempts;
- review/report/dispute submission;
- public profile scraping;
- admin actions;
- provider webhook anomalies.

Use actor, session, IP/network, device/provider signals as appropriate without treating IP as identity. Add card-testing defenses before live mode.

### 20.6 Error handling

Return stable error codes and privacy-safe messages. Do not reveal whether an email/account exists, internal risk rules, provider secrets, SQL errors, or sensitive record IDs. Include correlation IDs for support.

---

## 21. Checkout and PCI boundary

- Prefer processor redirect/hosted page for smallest scope unless approved embedded fields provide required conversion and compliance.
- Raw PAN/CVV never transits our client telemetry, servers, logs, database, queues, screenshots, or support tools.
- Payment iframe/hosted-field origins are allowlisted in CSP.
- Do not inject unapproved third-party scripts into checkout.
- Maintain a payment-page script inventory, ownership, justification, integrity/change monitoring, and deployment review consistent with the selected PCI scope and processor requirements.
- Analytics on checkout is first-party/minimal and must not inspect payment fields.
- A provider return/redirect is informational; webhook/API reconciliation determines payment truth.
- Handle browser close, back, duplicate submit, delayed webhook, failed redirect, 3DS cancellation, decline, and unknown outcome.
- Never show wallets for a lane/configuration that is not explicitly approved.

PCI scope and SAQ eligibility are `BLOCKED_EXTERNAL` until validated by processor/acquirer/assessor.

### 21.1 Statement descriptor and receipt clarity

The provider-approved statement descriptor is a privacy and chargeback control. It must be discreet but recognizable, never deceptive.

- Provider adapter exposes descriptor/capability metadata only from approved configuration.
- Checkout and receipt show the exact or accurately qualified descriptor when available.
- The descriptor/configuration version is snapshotted on the transaction.
- If the provider can vary the final descriptor, copy must say so accurately and support must be able to identify the charge.
- Adult/non-adult merchant portfolios may have different descriptors.
- Mock mode uses a clearly synthetic descriptor and cannot imply provider approval.

---

## 22. Public links, domain security, and anti-phishing

- One canonical production domain.
- No creator-chosen domains in V1.
- Transaction IDs are high entropy and non-sequential.
- Private transaction pages: `noindex,nofollow`, generic non-explicit OpenGraph metadata, restrictive referrer policy, no sensitive URL parameters after token exchange.
- Public creator pages clearly distinguish platform verification from endorsements.
- Reserve platform/admin/support-lookalike handles.
- Add report-impersonation/phishing path.
- Production email domain must use SPF, DKIM, and DMARC, with policy tightened after validation; monitor bounce/complaint/reputation.
- Security-sensitive email copy never includes explicit purchase details.
- Do not rely on URL shorteners.

---

## 23. Trust Engine

Trust is public evidence, not payout authorization.

Requirements:

- deterministic, versioned algorithm;
- source aggregates and exclusions retained;
- Bayesian/confidence-aware rating calculations;
- minimum publication thresholds;
- historical `trust_snapshot` linked to transaction page;
- no paid badge or manual marketing override;
- human correction only through audited factual remediation;
- public explanations use positive verified facts, not secret fraud labels;
- account closure/suspension behavior defined without erasing historical financial evidence.

Property tests must verify monotonic and boundary behavior where intended. Algorithm changes require backfill simulation and comparison before activation.

---

## 24. Risk Engine and payout security

Start rules-based and versioned. Every decision records inputs/features, reason codes, rule version, decision, expiry, and override history.

Signals may include:

- creator tenure/verification freshness;
- unique buyers and concentration;
- amount/velocity changes;
- refund/dispute/chargeback outcomes;
- provider fraud/3DS result;
- linked payment/device/account graph;
- payout destination age/ownership;
- recent email/passkey/account recovery;
- device/geography anomaly;
- prohibited-use/compliance flags.

Outputs:

- allow/review/deny transaction;
- per-transaction and period limits;
- outstanding exposure cap;
- payout hold/delay/cap;
- accelerated-payout eligibility;
- manual review.

Payout destination change requires step-up auth, ownership verification, out-of-band notice, cooldown, and risk reassessment. High public Trust must not bypass this.

Never expose exact internal fraud rules to users.

---

## 25. Review integrity and moderation

- Review eligibility is server-derived.
- One eligible transaction -> at most one canonical creator review.
- Reversed stolen/self/collusive transactions can be excluded from aggregate reputation through auditable moderation state.
- Public reviewer identity defaults to `Verified Buyer`.
- Review text has length limits, normalization, sanitization, reporting, moderation, and appeal.
- Creator cannot delete legitimate negative reviews.
- Delayed/double-blind publication may be configured to reduce retaliation.
- Graph/velocity controls detect review farms and repeated buyer/creator manipulation.
- Review aggregation is recomputed from eligible events, not manually edited totals.

---

## 26. Fulfillment, disputes, and evidence

### 26.1 Fulfillment

Store approved metadata only: creator declaration, time, method/category, and optional external reference. Do not ingest the deliverable.

### 26.2 Internal versus network dispute

Separate entities, IDs, states, deadlines, evidence, and outcomes. Cross-reference them to prevent double recovery.

### 26.3 Evidence

Default to:

- transaction snapshot;
- payment/authentication result;
- timestamps;
- creator delivery declaration;
- buyer confirmation/claim;
- approved external reference metadata;
- immutable activity/audit timeline;
- refund/dispute history.

No routine explicit-media evidence uploads.

### 26.4 Resolution

Financial resolution must produce provider command state, ledger postings, audit events, notifications, trust/risk recalculation, and reconciliation expectations atomically or through the outbox.

Manual decisions require reason codes and, above configured thresholds, dual approval.

---

## 27. Email and notification delivery

V1 requires email only.

- Abstract behind `EmailProviderAdapter` because vendor AUP acceptance is not assumed.
- Templates are versioned and privacy-safe.
- No explicit adult description in subject or lock-screen-like preview text.
- Use idempotency/deduplication keys.
- Track accepted/delivered/bounced/complained where provider supports it.
- Suppression/bounce must not silently break account security; expose recovery/support path.
- Magic-link email uses short expiry and hashed single-use token.
- Transaction update emails link to a secure exchange route, then clean URL.
- Never send full sensitive data to support or marketing systems.
- Marketing email is out of V1 scope.

---

## 28. PWA, browser, and cache behavior

- Service worker caches only versioned static shell/assets.
- Never cache authenticated HTML, guest transaction pages, API responses, KYC/age, dispute, payout, admin, or provider return data.
- Clear relevant caches on logout/version transition.
- Do not imply offline completion of financial actions.
- If offline, preserve non-sensitive draft input locally only where justified and clearly mark unsent state.
- Test current mobile Safari and Chrome, desktop Chrome/Firefox/Safari, narrow screens, browser back/forward, tab duplication, private browsing, cookie restrictions, and installed-PWA mode.
- Sensitive clipboard data should not be generated unnecessarily.

---

## 29. Product design and anti-vibe-coded UI

### 29.1 Design tokens

Define a single source of truth for:

- spacing;
- typography;
- line heights;
- radii;
- borders;
- elevation (minimal);
- surface/text/status colors;
- control heights;
- focus rings;
- motion durations/easing.

No one-off pixel values without documented exception.

### 29.2 Component inventory

Keep deliberately small:

- button/link;
- text input/select;
- amount input;
- field/error/help;
- status label;
- trust badge/stat;
- transaction row;
- timeline;
- confirmation sheet/dialog only where necessary;
- notice/banner;
- empty/loading/error states.

Do not import a generic dashboard theme. If an accessibility primitive library is used, restyle through our tokens and document why.

### 29.3 State completeness

Every screen documents and implements:

- initial;
- loading;
- empty;
- success;
- validation failure;
- permission/authorization failure;
- dependency outage;
- stale/concurrent update;
- offline/interruption;
- restricted/compliance state.

### 29.4 Jank rules

- no hydration flash/theme flash/layout shift;
- skeleton geometry matches final content;
- immediate pressed state;
- no duplicate financial submission;
- keyboard does not hide fields/actions;
- focus moves logically after errors/dialogs;
- back navigation is predictable;
- scroll position preserved where expected;
- no decorative gradients/glow/glass;
- no card around every group;
- motion is subtle, interruptible, and reduced-motion aware.

### 29.5 Content design

Use plain, precise words. Never imply guaranteed safety, anonymity from financial institutions, irreversible completion, or unlimited protection. Maintain a terminology glossary so `pending`, `available`, `reserved`, `delivered`, `completed`, `refunded`, and `disputed` never change meaning between screens.

---

## 30. Accessibility

Target WCAG 2.2 AA.

Critical requirements:

- semantic HTML and landmarks;
- keyboard-complete flows;
- visible focus not obscured;
- screen-reader names, descriptions, and state announcements;
- error summary and field association;
- touch target sizing;
- contrast;
- zoom/reflow at 200%+;
- reduced motion;
- no color-only meaning;
- accessible tables/timelines/statuses;
- logical focus after navigation, dialog, validation, and async updates.

Automated axe checks are necessary but insufficient. Manually test creator link creation, sign-in/passkey fallback, buyer transaction, receipt, dispute, review, payout/security settings, and core ops cases with keyboard and at least one screen reader.

---

## 31. API and contract design

- Command endpoints for mutations; no generic public CRUD.
- Zod schemas at every trust boundary.
- Maintain generated OpenAPI or equivalent internal contract for first-party APIs.
- Stable error envelope with code, safe message, correlation ID, and field errors.
- Explicit pagination with stable cursor; maximum page sizes.
- API inventory includes owner, auth, rate limit, input/output schema, data class, and deprecation state.
- Version canonical provider events and public API contracts.
- Contract tests ensure web, ops, worker, and adapters agree.
- No unbounded filters, exports, or search.
- Server derives creator/user IDs from auth context; never trusts client ownership fields.

---

## 32. Performance and capacity

### 32.1 Frontend targets

- LCP < 2.5s p75 on representative mobile traffic;
- CLS < 0.1;
- INP target < 200ms;
- minimize checkout JavaScript;
- public transaction page first useful content without blocking on noncritical metrics;
- avoid large images and third-party scripts.

### 32.2 Backend targets

Define and test initial SLOs/budgets for:

- read API p95/p99;
- command API p95/p99 excluding external checkout;
- webhook acknowledgment latency;
- webhook processing lag;
- job queue age;
- reconciliation completion;
- DB connection saturation;
- error rate;
- email delay.

Use load tests for public trust pages, transaction link opens, checkout creation, webhook bursts, and ops queries. Prevent noisy admin/report queries from exhausting transactional database resources.

---

## 33. Observability, SLOs, and auditability

### 33.1 Logs

Structured logs with redaction and:

- timestamp;
- service/environment/version;
- correlation/request ID;
- actor type and pseudonymous internal ID where allowed;
- transaction/provider event ID where allowed;
- outcome/error code;
- no secrets/sensitive payloads.

### 33.2 Traces and metrics

Use OpenTelemetry for traces/metrics. Trace web -> command -> DB/outbox -> worker -> provider where correlation is safe. Do not attach sensitive content as attributes.

### 33.3 Required dashboards/alerts

- checkout create/success/failure;
- provider latency/outage;
- webhook invalid signatures, backlog, duplicates, unknown event types;
- reconciliation breaks;
- payout failure/hold spikes;
- disputes/chargebacks/fraud spikes;
- KYC/age/email dependency failures;
- auth/recovery anomalies;
- privileged admin actions;
- queue dead letters;
- DB/storage health;
- error budget/SLO burn.

Every paging alert needs a runbook and owner. Avoid alerts with no action.

### 33.4 Audit log

Audit events are immutable, queryable, retained according to policy, and include actor, action, target, before/after summary, reason, case, source IP/device where justified, and correlation ID. Sensitive values are referenced/redacted, not copied indiscriminately.

---

## 34. Feature flags, kill switches, and safe degradation

Feature/config changes are server-side, validated, versioned, and audited.

Required kill switches:

- disable all new checkout;
- disable one provider configuration;
- disable adult lane;
- disable one jurisdiction;
- disable creator onboarding;
- force all payouts to hold;
- disable accelerated payout;
- disable review publication;
- disable guest link issuance;
- disable nonessential analytics/email.

Safety/compliance flags fail closed. Financial kill switches must be tested in staging and have runbooks. A kill switch may stop new actions without corrupting in-flight state.

---

## 35. Incident response and disaster recovery

Use an incident lifecycle aligned to preparation, detection, response, recovery, and lessons learned.

### 35.1 Severity examples

- SEV-1: active unauthorized money movement, sensitive KYC breach, systemic cross-tenant exposure, card-data exposure, widespread payout takeover.
- SEV-2: processor outage, reconciliation divergence, significant auth compromise, compliance control failure.
- SEV-3: contained feature degradation or isolated noncritical issue.

### 35.2 Required runbooks

- stop new payments;
- hold payouts;
- provider outage/unknown payment state;
- webhook backlog/replay;
- reconciliation break;
- account takeover/payout destination theft;
- KYC/privacy breach;
- admin compromise;
- prohibited-content/underage report;
- bad migration/deployment;
- email compromise/phishing;
- credential/key rotation.

### 35.3 Recovery

Production database must have managed backups and point-in-time recovery. Define initial targets before live launch (example planning target: RPO <= 5 minutes and RTO <= 4 hours) and prove them with restore exercises; an untested backup is not evidence.

Keep encrypted exports of critical configuration, schema/migrations, provider identifiers, and reconciliation records as appropriate. Do not copy raw identity/card data into ad hoc backups.

### 35.4 Post-incident

Write blameless but specific postmortems: timeline, detection gap, root cause, impact, corrective actions, owners, deadlines, sibling-defect search, and control/test updates.

---

## 36. Environments, configuration, and infrastructure

### 36.1 Isolation

Separate local, test, staging, provider sandbox, and production:

- databases;
- secrets;
- provider accounts/keys;
- domains/WebAuthn RP IDs;
- email routing;
- object stores if any;
- telemetry;
- feature flags.

Never use production user data in local/test. Seed only synthetic data.

### 36.2 Configuration

Validate environment at process startup with a typed schema. Crash before serving if mandatory secrets/config are missing or contradictory. Redact config output.

### 36.3 Secrets

- secret manager/KMS in hosted environments;
- no secrets in Git, Docker image, client bundle, CI logs, screenshots, or example files;
- rotation policy and versioned secrets;
- least-privilege credentials per service/environment;
- emergency revocation runbook.

### 36.4 Infrastructure as code

Local environment uses committed Docker Compose. Production infrastructure must be reproducible through documented configuration/IaC before live launch. Do not hand-create undocumented databases, cron jobs, buckets, or secrets.

### 36.5 Database roles

Use separate least-privilege roles for migrations, application runtime, read-only operations/reporting, and backup/reconciliation where practical. App runtime must not own superuser privileges.

---

## 37. Database migrations and release compatibility

- Every schema change is a reviewed migration committed to source.
- Use expand/backfill/verify/contract for destructive or incompatible changes.
- Do not deploy code that assumes a destructive migration completed everywhere unless rollout ordering is guaranteed.
- Migration obtains an application/advisory lock and records checksum/status.
- Backfills are resumable, observable, rate limited, and idempotent.
- Test migration from the previous production schema with representative data.
- Test rollback of application code even when schema rollback is unsafe.
- Never delete or rewrite ledger/audit history in a migration.
- Provider/canonical event schema changes require backward compatibility and replay fixtures.

---

## 38. Secure software supply chain

- Commit one pnpm lockfile and use frozen-lockfile installs in CI.
- Pin exact direct dependency versions; no committed `latest`/wildcard ranges for critical packages.
- Every new dependency needs purpose, maintenance, license, security, transitive footprint, and removal evaluation.
- Prefer platform/library capabilities over tiny unmaintained packages.
- Generate an SBOM for release artifacts.
- Scan dependencies, containers, licenses, secrets, and source.
- Use protected branches, required review, and CODEOWNERS for auth, payments, ledger, risk, compliance, and infrastructure.
- CI build identities receive least privilege.
- Keep build provenance/attestation where deployment tooling supports it.
- Do not run untrusted install scripts without review.
- AI-generated code is untrusted input and receives the same review/tests as human code.
- Patch critical framework/runtime vulnerabilities immediately and rotate secrets if the advisory indicates possible exposure.

---

## 39. CI/CD and deployment

### Every commit/PR

- format check;
- ESLint;
- TypeScript;
- unit/property tests;
- integration tests with real PostgreSQL;
- migration lint/apply test;
- dependency/license/security scan;
- secret scan;
- build all apps/packages;
- API contract diff;
- accessibility smoke;
- no uncommitted generated output.

### Main/release candidate

- full Playwright E2E;
- visual regression review;
- load smoke;
- backup/restore and migration evidence on schedule;
- provider mock contract corpus;
- provider sandbox suite when enabled;
- reconciliation dry-run;
- SBOM/provenance artifact;
- environment/config diff;
- known-issues/release dossier.

### Deployment

- immutable artifact/container;
- health/readiness probes;
- migration plan separated from app start when appropriate;
- gradual/canary deployment when platform permits;
- automatic rollback for application health, but never automatic database history erasure;
- deployment marker in telemetry;
- tested payment/payout kill switches.

No direct production patching outside a documented emergency procedure.

---

## 40. Testing strategy

`11_ACCEPTANCE_TEST_MATRIX.md` is the canonical adversarial scenario catalog. Convert every applicable row into an automated test, manual evidence item or runbook exercise; do not merely cite the matrix as reviewed.

### 40.1 Unit

- value objects/money/rounding;
- transition guards;
- permissions;
- fee/limit policy;
- trust/risk rules;
- token expiry/replay;
- DTO redaction.

### 40.2 Property-based

- ledger always balances;
- refund total never exceeds capture;
- duplicate/reordered events do not change final invariants incorrectly;
- unauthorized actor never gains scope by arbitrary IDs;
- public DTO never contains restricted fields;
- state-machine invalid transitions reject;
- rating/confidence calculations stay in valid bounds.

### 40.3 Integration

Use a real disposable PostgreSQL database:

- constraints/transactions/locking;
- outbox/inbox;
- migrations;
- auth sessions/tokens;
- ledger/reconciliation;
- adapter normalization;
- audit events.

### 40.4 Contract

- API schemas;
- web/worker/ops package compatibility;
- provider event fixture corpus;
- email adapter;
- identity/age adapter.

### 40.5 E2E

- creator signup/magic link/passkey setup;
- create/cancel/expire link;
- public trust page;
- guest mock checkout;
- redirect returns before/after mock webhook;
- fulfillment;
- buyer confirmation;
- dispute and resolution;
- review and aggregation;
- payout hold/destination change;
- ops authorization and audit.

### 40.6 Failure/fault tests

- duplicate/out-of-order/missing provider events;
- unknown provider event type;
- payment succeeds but browser return fails;
- browser return succeeds but payment fails/pending;
- worker crash between side effect and acknowledgement;
- DB deadlock/retry;
- provider timeout/outage;
- email failure/bounce;
- refund twice/partial refund races;
- dispute after payout;
- payout reversal;
- account recovery during open transactions;
- token leak/revocation;
- stale form/version conflict;
- storage full/backup restore where practical;
- clock/timezone boundary;
- malicious Unicode/HTML/URL input;
- IDOR and role escalation.

### 40.7 Visual/accessibility/browser

Playwright screenshots at representative mobile/desktop widths, light mode (and dark only if intentionally supported), long text, zoom, reduced motion, keyboard, screen reader spot checks, Safari/WebKit, Chrome/Chromium, Firefox.

### 40.8 Security

Map applicable OWASP ASVS controls into tests/manual verification. Perform authorization matrix testing, dependency scanning, CSP/header tests, rate-limit tests, webhook replay tests, session/recovery review, and an independent penetration test before live money.

### 40.9 Flake policy

Do not hide flaky tests with retries indefinitely. Quarantine only with owner/issue/deadline. Financial/security tests must be deterministic.

---

## 41. Admin, support, and operations

The ops UI is not a CRUD admin panel.

Required case-centered views:

- creator onboarding/compliance;
- transaction timeline;
- internal dispute;
- network dispute/chargeback;
- refund;
- risk decision;
- payout/hold;
- reconciliation break;
- abuse/legal/privacy request;
- audit history.

Rules:

- least privilege and field-level redaction;
- support cannot see raw KYC/card data;
- risk cannot casually browse unrelated support content;
- engineering has no default production record access;
- every manual action has reason and case;
- destructive/financial action confirms exact amount/currency/recipient and requires step-up;
- support authentication never relies on public order code alone;
- exports are scoped, watermarked/audited where appropriate, and expire;
- no bulk user export without elevated approval.

---

## 42. Analytics and experimentation

Maintain a versioned event catalog. Financial/trust events are emitted server-side from authoritative state transitions; client events cannot claim a payment or completion occurred.

Each event defines:

- owner;
- exact trigger;
- schema/version;
- allowed properties;
- data classification;
- retention;
- downstream use;
- deduplication key.

No explicit description, legal identity, email, token, payment fingerprint, or secret risk reason in analytics.

Do not experiment on security, compliance, authorization, dispute fairness, or payout correctness without explicit review. Experiments have assignment persistence, exposure event, stop condition, and guardrail metrics.

North star remains Successfully Completed Protected GMV, not raw GMV.

---

## 43. Business continuity and vendor risk

Maintain `docs/vendor-register.md` for processor, KYC/age, email, hosting, monitoring, support, and analytics vendors:

- purpose/data shared;
- AUP acceptance of intended business;
- security/privacy posture;
- subprocessors/location;
- contract/termination/export;
- outage behavior;
- fallback/migration plan;
- owner and review date.

The product must operate safely when a dependency is down:

- public pages may remain read-only;
- new checkout may stop;
- payment state becomes pending/unknown, never guessed;
- payouts may hold;
- jobs retry/reconcile;
- status copy is honest.

Do not create a fake success state to preserve conversion.

---

## 44. Known failure patterns to search proactively

Before release, search specifically for:

- shared cache leaking one buyer/creator to another;
- frontend-only field hiding;
- public order code used as authorization;
- bearer token stored plaintext or left in URL;
- payment redirect treated as payment success;
- duplicate webhook causing duplicate ledger/refund/email;
- `number`/floating-point money;
- mutable balance without journal;
- reserve counted as revenue;
- transaction using current fee/policy rather than purchase snapshot;
- payout trust tier bypassing private risk;
- payout destination changed without cooldown;
- creator able to review themselves;
- repeated collusive buyer reviews;
- adult lane using an unapproved wallet/provider setting;
- arbitrary URL fetch/SSRF;
- sensitive pages cached by Next.js/service worker/CDN;
- session replay/analytics collecting transaction secrets;
- support role seeing KYC or fraud data;
- missing legal/policy acceptance version;
- migration deleting immutable history;
- silent reconciliation overwrite;
- provider unknown event ignored without alert;
- no route/body limits on webhooks/reviews;
- Unicode lookalike creator handles;
- passwordless recovery weakening payout security;
- production secret or real data in test fixtures;
- generic component-kit styling inconsistent with product spec.

Every defect triggers a sibling-pattern search and regression test.

---

## 45. Required build outputs

The one-go provider-agnostic build is incomplete unless the repository contains:

- runnable `web`, `ops`, and `worker` apps;
- local Docker Compose and setup instructions;
- synthetic seed data;
- mock payment/identity/age/email adapters;
- creator auth with magic link + passkey;
- creator/public/guest/ops flows from the product spec;
- canonical state machines;
- database schema and migrations;
- authorization matrix and safe DTOs;
- transaction-scoped guest access token exchange;
- transactional outbox/inbox worker;
- append-only ledger and reconciliation framework;
- trust and rules-based risk engines;
- internal disputes/reviews/admin cases;
- audit logging;
- feature flags/kill switches;
- structured logs/traces/metrics;
- complete tests and browser screenshots;
- threat model, data register, standards register, ADRs, runbooks, API contract, traceability, and release report using the repository templates.

Provider sandbox/live modules remain clearly marked `BLOCKED_EXTERNAL`, not replaced by fake APIs.

---

## 46. Definition of Done

### 46.1 Feature-level VERIFIED

A feature is `VERIFIED` only when:

- requirement IDs are satisfied;
- schema/migration/constraints exist where needed;
- authorization and safe output are tested;
- happy, empty, loading, failure, retry, and concurrency states are covered;
- audit/observability exist;
- unit/integration/E2E tests pass as applicable;
- privacy/data classification reviewed;
- accessibility and mobile UX checked;
- performance impact measured where material;
- no known critical/high security defect remains;
- traceability evidence is linked.

### 46.2 Provider-agnostic V1 VERIFIED

All items in `10_RELEASE_ACCEPTANCE_MATRIX.md` except `LIVE-*` are `VERIFIED`, or explicitly `NOT_APPLICABLE` with rationale.

### 46.3 Sandbox VERIFIED

Selected provider adapter passes signed webhook, duplicate/reorder, payment truth, refund, dispute, payout, and reconciliation tests against its real sandbox.

### 46.4 Live-money release

Requires named human approvals and external evidence for provider underwriting, funds flow, adult compliance, jurisdiction, legal policies, PCI scope, production security assessment, actual pricing/limits/reserves, operational staffing/runbooks, and reconciliation.

No AI may self-approve a `LIVE-*` gate.

---

## 47. Final Grok reporting format

At completion, produce:

1. what was built;
2. architecture and key decisions;
3. exact commands to run locally;
4. test/build results with counts;
5. screenshots/visual review summary;
6. security/privacy/authorization review;
7. ledger/reconciliation invariant results;
8. requirement status summary;
9. remaining `BLOCKED_EXTERNAL` items only;
10. known limitations/risks;
11. changed files and migration list.

Do not end with “the foundation is ready for future implementation” if non-blocked implementation remains. Continue working first.
