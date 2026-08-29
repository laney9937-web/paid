# Paid — Final V1 Execution Bundle

**Bundle version:** 2.3 Paid working-brand package  
**Current build mode:** `PROVIDER_AGNOSTIC`  
**Last standards check:** 2026-08-29

## What this package does

It gives Grok Build a deterministic, implementation-grade specification for building the complete provider-independent Web/PWA product in one long-running execution. Unknown processor contracts, legal opinions, underwriting decisions and production credentials remain explicit external gates instead of being fabricated.

The package includes an `AGENTS.md` entry point, repository-scoped Grok skills, a locked decision document, exact last-mile implementation contracts, ready-to-copy templates, two verification matrices and an exact `/goal` invocation.

## Product thesis

**Paid** is a trust-first transaction product. A creator privately verifies identity, operates publicly under a pseudonym, creates one protected transaction link and shares it anywhere. A guest buyer sees transaction-authenticated trust, pays through a specialist provider, remains anonymous to the creator by default, and can confirm delivery, dispute or leave a verified review.

The moat is **verified pseudonymous trust**, not payment processing.

## Governing read order

1. `AGENTS.md` — concise coding-agent entry point.
2. `README.md` — package use and boundaries.
3. `01_V1_PRODUCT_UX_SPEC.md` — product and interaction behavior.
4. `02_PROVIDER_SCORECARD.md` — Segpay/CCBill/Verotel decision model.
5. `03_GROK_BUILD_BIBLE.md` — engineering, financial, privacy, security, compliance, reliability and quality constitution.
6. `04_WEB_PWA_BUILD_SPEC.md` — frozen stack, repository, routes, data model, milestones and commands.
7. `05_CLOSED_BETA_OPERATING_PLAN.md` — controlled 10–25 creator beta.
8. `06_PROVIDER_RESPONSE_MATRIX.md` — fill only from written underwriter replies.
9. `07_GROK_EXECUTION_PROMPT.md` — direct long-running build objective.
10. `08_FINAL_GAP_AUDIT.md` — omissions discovered and closed.
11. `09_IMPLEMENTATION_DECISION_LOCK.md` — choices Grok must not re-litigate.
12. `10_RELEASE_ACCEPTANCE_MATRIX.md` — exact release and live external gates.
13. `11_ACCEPTANCE_TEST_MATRIX.md` — adversarial scenarios and evidence requirements.
14. `12_STANDARDS_REFERENCE_NOTE.md` — current version/standards context.
15. `13_LAST_MILE_IMPLEMENTATION_CONTRACTS.md` — exact value-object, schema, API/event, link-reservation, email-token, provider-capability and simulator mechanics.
16. `14_BRAND_NAME_AND_STORE_METADATA.md` — Paid working-brand rules, clearance gates, metadata and fallback behavior.
17. `.grok/skills/` — path/trigger-specific review procedures, including exact last-mile contract enforcement.
18. `templates/` — ready-to-copy governance, threat-model, authorization, provider, state-machine and release evidence schemas.
19. `prototype/` — non-production UX reference only.

## Frozen V1 scope

Web/PWA; US approved jurisdictions; USD; `en-US`; guest checkout; creator pseudonyms; anonymous-to-creator buyers; verified transaction reviews; buyer-protection workflow; external fulfillment; creator-side fees; separate Trust/Risk engines; deterministic provider mocks; double-entry ledger; reconciliation framework; staff operations; full tests.

No subscriptions, tips, wallet, arbitrary P2P, media uploads, feed, DMs, discovery, native dependency or startup-financed instant payout.

## Recommended Grok Build launch

1. Extract this bundle as the repository root.
2. Start Grok Build from that root so it discovers `AGENTS.md` and `.grok/skills/`.
3. Use this single command:

```text
/goal Build the complete PROVIDER_AGNOSTIC V1. Read AGENTS.md and every governing document in its required order, then execute 07_GROK_EXECUTION_PROMPT.md. Continue until pnpm verify passes from a clean checkout and every non-LIVE item in 10_RELEASE_ACCEPTANCE_MATRIX.md is VERIFIED or justified NOT_APPLICABLE. Do not process live money or fabricate external approvals.
```

`/goal` is preferred because this is a long-running implementation/verification objective, not a one-message code-generation task.

## Live-money boundary

Do not enable real payment, KYC, age, sanctions, refund, settlement or payout behavior until every applicable `LIVE-*` gate in `10_RELEASE_ACCEPTANCE_MATRIX.md` is approved. The provider-independent codebase can and should be fully built before those replies arrive.

## Final deliverable expected from Grok

A runnable repository, migrations, synthetic fixtures, deterministic provider simulator, creator/buyer/ops vertical slices, tests, security/privacy evidence, balanced ledger/reconciliation evidence, runbooks, build manifest and a completion dossier. A plan or polished prototype is not completion.

## Run the PROVIDER_AGNOSTIC implementation

Requires Node.js 24 LTS (`nvm use`), pnpm 10.15.1, and Docker.

```bash
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm verify
pnpm dev:web    # http://localhost:3000
pnpm dev:ops    # http://localhost:3001
pnpm mock:scenario -- --name all
```

Working brand: **Paid**. Example public origin in copy: `paid.example`. Synthetic seed: `maya@paid.example`. No live money.
