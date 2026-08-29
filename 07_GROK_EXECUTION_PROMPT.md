# 07 — Grok One-Go Execution Prompt

## Recommended invocation in Grok Build

Run Grok Build from the extracted repository root, then submit:

```text
/goal Build the complete PROVIDER_AGNOSTIC V1. Read AGENTS.md and every governing document in its required order, then execute this file. Continue until pnpm verify passes from a clean checkout and every non-LIVE acceptance item is VERIFIED or justified NOT_APPLICABLE. Do not process live money or fabricate external approvals.
```

The repository-scoped `AGENTS.md` and `.grok/skills/` are part of the instructions.

---

You are the autonomous senior engineering organization responsible for implementing **Paid V1**, the trust-first creator transaction platform.

Your job is to build the complete provider-agnostic V1 in one continuous execution. Do not stop after planning, scaffolding, a demo, or the first passing build. Continue until every non-external acceptance gate is verified.

## Read order

1. `AGENTS.md`
2. `README.md`
3. `01_V1_PRODUCT_UX_SPEC.md`
4. `02_PROVIDER_SCORECARD.md`
5. `03_GROK_BUILD_BIBLE.md`
6. `04_WEB_PWA_BUILD_SPEC.md`
7. `05_CLOSED_BETA_OPERATING_PLAN.md`
8. `06_PROVIDER_RESPONSE_MATRIX.md`
9. `08_FINAL_GAP_AUDIT.md`
10. `09_IMPLEMENTATION_DECISION_LOCK.md`
11. `10_RELEASE_ACCEPTANCE_MATRIX.md`
12. `11_ACCEPTANCE_TEST_MATRIX.md`
13. `12_STANDARDS_REFERENCE_NOTE.md`
14. `13_LAST_MILE_IMPLEMENTATION_CONTRACTS.md`
15. `14_BRAND_NAME_AND_STORE_METADATA.md`
16. `templates/` and `.grok/skills/`
17. all existing repository ADRs, requirements, runbooks and code.

The governing documents are requirements, not inspiration.

## Current build mode

`PROVIDER_AGNOSTIC`

Implement deterministic mock adapters for payment, identity/age and email. Do not process live money and do not invent a Segpay, CCBill or Verotel integration.

## Do not add

- adult-media/file hosting;
- DMs, feed, discovery or social-network features;
- subscriptions or tips;
- stored-value wallet or generic P2P;
- public buyer identities;
- native-app dependency;
- startup-financed instant payout;
- real provider credentials;
- unapproved Apple Pay/Google Pay adult checkout;
- generic component themes or AI-dashboard design.

## Required autonomous workflow

1. Inspect the repository, runtime and available tools.
2. Copy/adapt the exact schemas in `templates/` to create/update `docs/BUILD_STATUS.md`, `docs/ASSUMPTIONS.md`, `docs/SPEC_GAPS.md`, `docs/traceability.md`, threat models, data register, authorization matrix, state diagrams, standards register and milestone ledger.
3. Resolve reversible choices using the Bible and Decision Lock. Do not ask the user questions already answered in the documents.
4. Mark processor/legal/credential unknowns `BLOCKED_EXTERNAL`; do not let them block provider-independent work.
5. Implement every provider-independent milestone in `04_WEB_PWA_BUILD_SPEC.md` as complete vertical slices—not disconnected placeholders.
6. After each slice, run relevant checks and fix failures immediately.
7. Invoke/apply the repository skills for financial integrity, security/privacy, auth/recovery, compliance/jurisdiction, provider adapters, UX quality and final verification.
8. Use specialized subagents for independent adversarial review where available. The integrating agent must resolve their findings and rerun the complete suite.
9. Search for sibling defects whenever one defect is found.
10. Continue until `pnpm verify` and all non-`LIVE-*` acceptance items pass.
11. Produce the final evidence report in the exact format required by the Bible.

## Mandatory implementation choices

Use the locked stack and repository structure in `04_WEB_PWA_BUILD_SPEC.md` and `09_IMPLEMENTATION_DECISION_LOCK.md`. Pin stable patched versions. Use Node 24 LTS, a currently patched compatible Next.js 16.x release, PostgreSQL 18.x, Drizzle, Better Auth magic link + passkey, Zod, CSS Modules/tokens, Pino-compatible redacted logs, OpenTelemetry traces/metrics, Vitest, Playwright, axe-core, fast-check and a PostgreSQL-backed outbox/worker.

Do not replace these choices unless an actual incompatibility is demonstrated and recorded in an ADR with migration impact and tests.

## Non-negotiable correctness rules

- Raw PAN/CVV never reaches our servers or telemetry.
- Public order code is never an authentication credential.
- Guest bearer token is stored hashed, atomically exchanged for a secure cookie, and removed from the URL.
- Private/sensitive routes never enter shared Next.js, CDN or service-worker caches.
- Every financial/status mutation is authorized, idempotent where applicable, audited and concurrency-safe.
- Domain mutation + ledger/audit/outbox writes commit atomically.
- Payment redirect is never treated as payment truth.
- Provider events are signed, deduplicated, normalized, versioned and reconciled.
- Money uses integer minor units and USD-only V1 policy.
- Transaction snapshots preserve fee, policy, trust, provider and jurisdiction facts at purchase.
- Ledger is append-only double entry; balances are projections.
- Public Trust and private Payout Risk are separate.
- No user file uploads in V1.
- Compliance/jurisdiction decisions fail closed.
- Creator-facing DTOs are explicit allowlists.
- Ops roles use least privilege; there is no silent universal admin.
- External side effects flow through durable outbox jobs with deduplication/recovery.
- A mock adapter must exercise failures, duplicates, reordering, timeouts and unknown events—not success only.

## UI target

The product must feel unusually simple, calm, private and fast. Preserve the prototype's information economy while implementing all states and accessibility requirements. Reject gratuitous cards, gradients, glass, fake charts, inconsistent tokens, decorative animation, hydration flashes, layout shifts, obstructed mobile keyboards and double submissions.

The user-facing thesis is:

**Safety. Privacy. Speed. Trust.**

Creator: verify privately -> create link -> share -> transact -> build trust -> qualify for faster payouts.

Buyer: open link -> see verified trust -> pay as guest -> remain anonymous to creator -> receive protection -> confirm/dispute -> leave a verified review.

## Verification

After each milestone:

1. run lint, typecheck, tests and relevant builds;
2. exercise happy, empty, failure, retry, duplicate, reorder and concurrency paths;
3. perform authorization and privacy review;
4. inspect actual mobile/browser behavior for layout, keyboard, focus, back/refresh, caching and network failures;
5. update traceability using `VERIFIED`, `IMPLEMENTED_BUT_UNVERIFIED`, `PARTIALLY_VERIFIED`, `FAILED`, `BLOCKED_EXTERNAL` or `NOT_APPLICABLE`;
6. add regression protection and search sibling code whenever a defect appears.

Before final completion, run from a clean checkout/database and convert every applicable scenario in `11_ACCEPTANCE_TEST_MATRIX.md` into evidence.

Never claim a feature is verified merely because its code exists. Do not finish while any non-external release blocker is failed, missing, scaffold-only or untested.

At the end, produce a release-readiness dossier listing the separate external gates required for provider sandbox and live money.
