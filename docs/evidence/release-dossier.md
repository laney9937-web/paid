# Provider-Agnostic Release Dossier

**Commit:** `91d30c201abfab73c0f5e53c0a9bd7df06729819`  
**Build artifact/digest:** Next.js 16.3.3 production webpack builds of web/ops; worker tsc dist  
**Schema/migration version:** `0001_init`  
**Dependency lock digest:** `docs/evidence/sbom.json`  
**Build mode:** `PROVIDER_AGNOSTIC`  
**Prepared by:** Integrating agent  
**Review date:** 2026-08-29

## 1. What was built

Provider-agnostic V1 of Paid: creator links, guest scanner-safe checkout, mock payments, double-entry ledger, outbox worker, isolated ops app, trust/risk engines, T&S routing, fail-closed config, and `pnpm verify`.

## 2. Architecture and key decisions

- Node 24 / pnpm / Next 16.3.3 / PostgreSQL 18.6 / Drizzle SQL / Better Auth magic-link+passkey / Zod / CSS Modules+tokens / Pino / Vitest / Playwright.
- Money is bigint USD. Guest tokens HMAC-SHA-256. One nonterminal reservation and one captured payment per link.
- Payment truth is provider events, never browser return.
- Postgres unit of work commits domain + ledger + audit + outbox atomically.
- ADR-001 records the stack pin. Mock adapters only; no invented Segpay/CCBill/Verotel integration.

## 3. Exact commands to run locally

```bash
nvm use 24.19.0
pnpm install --frozen-lockfile
pnpm db:up
# wait until postgres is ready
pnpm db:migrate
pnpm db:seed
pnpm verify
```

Environment: Node 24 LTS, pnpm 10.15.1, Docker Compose PostgreSQL 18.6. `DATABASE_URL` and `TOKEN_HMAC_KEY_V1` from `.env.example`.

## 4. Test/build results

| Gate group | Passed/total | Evidence path | Status | Notes |
|---|---:|---|---|---|
| Build BUILD-001–009 | 9/9 | pnpm verify | VERIFIED | |
| Product PROD-001–010 | 10/10 | e2e + domain + static | VERIFIED | |
| Authorization AUTHZ-* | 7/7 | vitest G-* | VERIFIED | |
| Authentication AUTH-* | 8/8 | vitest I-* | VERIFIED | |
| Privacy PRIV-* | 10/10 | vitest + headers | VERIFIED | |
| Compliance COMP-* | 13/13 | decideCheckout + T&S | VERIFIED | |
| Payments PAY-* | 12/12 | simulator + inbox | VERIFIED | |
| Ledger LEDGER-* | 10/10 | journals + recon | VERIFIED | |
| Reliability REL-001–006 | 6/6 | pg-uow + worker | VERIFIED | |
| Trust/risk | 10/10 | trust.test + F-* | VERIFIED | |
| Security SEC-001–009 | 9/9 | headers + static + adversarial | VERIFIED | SEC-010 N/A → LIVE-010 |
| UX/ACC/PERF | see N/A | playwright + load-smoke | VERIFIED except ACC-002, UX-006 N/A | Chromium |
| Ops OPS-* | 9/9 | worker + runbooks + RBAC | VERIFIED | |
| Release REL-007–014 | mixed | migrations + dossier | REL-007/008/011/014 N/A | first schema / no live host |
| LIVE-* | 0 self-approved | docs/SPEC_GAPS.md | BLOCKED_EXTERNAL | |

Catalog: `docs/evidence/acceptance-test-results.md` (unique 11_ IDs). Traceability: `docs/traceability.md`.

## 5. Screenshots / visual review

Playwright Chromium: `/c/maya` and `/ops/sign-in` with axe-core (no critical/serious). 320px and 390px overflow checks, 200% zoom, reduced-motion. Guest checkout: GET prefetch, POST cookie, mock capture, reload.

## 6. Security/privacy/authorization review

No PAN/CVV fields. Guest tokens hashed. Order code is not auth. Creator DTO allowlist. Private Cache-Control. CSP + HSTS + nosniff + noindex. Ops isolated origin and cookie name. Scanner GET does not consume. SSRF: no user-URL fetch. Legal hold blocks deletion. Dual-control adjustments.

## 7. Ledger/reconciliation invariants

Capture journals balance. Reserve is a liability, not revenue. Duplicate webhooks do not double-post. Partial refund cannot exceed refundable. Chargeback after payout posts receivable without auto-refund. Projections match journals as-of. Reconciliation reports missing capture/fee/refund/reserve/payout. Late capture after timeout is applied.

## 8. Requirement status summary

Every non-LIVE `10_RELEASE_ACCEPTANCE_MATRIX.md` row is `VERIFIED` or `NOT_APPLICABLE` with rationale in `docs/traceability.md`. Every `11_ACCEPTANCE_TEST_MATRIX.md` scenario has a unique ID in `docs/evidence/acceptance-test-results.md`.

## 9. Remaining BLOCKED_EXTERNAL items only

`LIVE-001`–`LIVE-016` and `LIVE-BRAND-001`–`LIVE-BRAND-005` as listed in `docs/SPEC_GAPS.md`. None were self-approved.

## 10. Known limitations / risks

- WebKit/Firefox/installed-PWA and dedicated screen-reader sessions remain operator evidence before live.
- PITR restore drill requires a provisioned host.
- Better Auth passkey enrollment is library-pinned; browser ceremony against a real authenticator is operator evidence.
- Adult live lane, real processors, and legal policies remain BLOCKED_EXTERNAL.

## 11. Changed files and migrations

Primary schema: `packages/db/src/migrations/0001_init.sql` (only supported migration). Domain additions this pass: reservation release, payout destination/recovery, manual adjustment, T&S routing, legal-hold planner, checkout return allowlist, provider outage outcome, chargeback/payout journals, guest token revoke. Tests: `tests/acceptance-matrix.test.ts`, `tests/static-invariants.test.ts`, `tests/e2e/ux-quality.spec.ts`.

## Final status

`PROVIDER_AGNOSTIC_VERIFIED`
