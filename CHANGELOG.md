# CHANGELOG

## Unreleased — PROVIDER_AGNOSTIC HTTP/worker wiring

- Creator APIs require hashed `paid_session`; local seed session is HMAC-stored, not a raw actor stub.
- Guest ACCESS tokens are peek-only on GET; POST issues a hashed SESSION cookie (HttpOnly, SameSite, Secure from origin).
- Mock capture requires the guest session and a signed mock webhook body; public order codes cannot capture.
- Public `/c/[handle]` trust tier is computed from real reviews and captured counts.
- Worker leases Postgres `outbox_jobs` (`FOR UPDATE SKIP LOCKED`) and records `side_effect_at` so crash-before-ack retries do not resend.
- Web/ops/worker fail-closed at boot and start OTel; Playwright loads `.env.example` because `next start` does not.
- Live-money fail-closed gates use `PAID_ENV` / `PAID_BUILD_MODE`, not `NODE_ENV` (required by `next start`).

## 2.3 — Paid working-brand pass

- Locked `Paid` as the customer-facing working product name and updated the PWA prototype.
- Added `14_BRAND_NAME_AND_STORE_METADATA.md`.
- Added exact App Store reservation, trademark/common-law, domain, Google Play and statement-descriptor external gates.
- Preserved `Trust Engine` and `Risk Engine` as domain terminology.
- Prevented Grok from claiming the brand is legally cleared or using third-party domains such as `paid.com` or `paid.link`.
- Added brand consistency and safe-claims verification.

## 2.2 — Last-mile implementation contract pass

- Added `13_LAST_MILE_IMPLEMENTATION_CONTRACTS.md` with minimum schema/value-object, API/event, link reservation, scanner-safe token exchange, provider capability and simulator contracts.
- Added ready-to-copy templates for governance, security, state models, runbooks and final evidence.
- Added external sales/use-tax, marketplace-facilitator and dormant/unclaimed-funds decision gates.
- Added statement-descriptor snapshot/disclosure, risk fairness/appeal and webhook key-rotation rules.
- Harmonized the mandatory read order, link state machine, auth routes, provider interface, release matrix and adversarial tests.
- Added deterministic simulator production-exclusion and exact last-mile traceability gates.

## 2.1 — One-go execution harmonization

- Added and aligned the Implementation Decision Lock.
- Split release gates and adversarial scenario matrices into stable numbered documents.
- Standardized `apps/ops` and `BLOCKED_EXTERNAL` across every file and skill.
- Added exact Grok Build `/goal` launch instructions.
- Rewrote Grok skills to use stable heading references and added auth/recovery and compliance/jurisdiction skills.
- Expanded read order, provider-mock behavior, fail-closed startup rules and completion evidence.
- Added ready-to-copy governance, threat-model, authorization, provider, state-machine, incident and release-evidence templates.
- Added an external legal/compliance decision register covering funds flow, tax/PSE, sanctions/AML, adult/2257, child-safety, IP/DMCA, privacy/biometric, unclaimed-funds and consumer disclosures.
- Added statement-descriptor snapshot, receipt and provider capability requirements.
- Revalidated cross-references, Markdown fences, manifest and ZIP integrity.

## 2.0 — Final gap pass

- Rewrote Grok Bible around explicit build modes, stack, autonomous execution, and release evidence.
- Added authorization/tenant isolation and safe DTO requirements.
- Added transaction snapshots, expanded state machines, concurrency controls, provider inbox, transactional outbox, dead letters, and retry policy.
- Expanded ledger/reconciliation for reserves, partial refunds, chargebacks, reversals, negative balances, and adjustments.
- Added compliance/jurisdiction engine, agreement versioning, T&S case flow, adult/non-adult lane separation, and no-media/no-URL-fetch rules.
- Added hashed guest token exchange, full session/recovery policy, staff auth, privacy rights, retention/legal hold, encryption/key rotation, and sensitive analytics restrictions.
- Added web security headers, Next.js cache controls, PCI checkout script governance, anti-phishing/domain/email controls.
- Added feature flags/kill switches, incident response, disaster recovery, supply-chain security, migration/release strategy, provider continuity, and detailed testing.
- Added exact one-go execution prompt, `AGENTS.md`, final gap audit, and release acceptance matrix.
