# Provider-Agnostic Release Dossier

**Commit:** `e97f1a12240f42d2c38669e5b7c3c3b403a4af72` (dual clean-checkout `pnpm verify` both `VERIFY_OK`: 142 unit / 16 Playwright / 16 simulator)  
**Build artifact/digest:** Next.js 16.3.3 production webpack builds of web/ops; worker tsc dist  
**Schema/migration version:** `0001_init` + `0002_auth_outbox` + `0003_staff` + `0004_auth_financial_integrity` + `0005_refund_cap_inbox_recovery`  
**Dependency lock digest:** `docs/evidence/sbom.json` (lock `e460c7ba6a7b9c5a850b11ff8f2e1bc285161ee6b35390ea53ba5ca23d91e385`)  
**Build mode:** `PROVIDER_AGNOSTIC`  
**Prepared by:** Integrating agent  
**Review date:** 2026-08-30

## 1. What was built

Provider-agnostic V1 of Paid plus the auth/financial/trust integrity repair: session-true staff RBAC, envelope-encrypted one-time secrets, stable checkout idempotency, payout/refund request vs provider settlement, exhaustive provider-event outcomes, additive `0004` financial constraints, ledger-accurate balances, truthful public trust, role-gated ops consoles, and GitHub Actions for `pnpm verify`.

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
pnpm db:reset
pnpm db:migrate
pnpm db:seed
pnpm verify
pnpm verify
```

Environment: Node 24 LTS, pnpm 10.15.1, Docker Compose PostgreSQL 18.6. `DATABASE_URL` and `TOKEN_HMAC_KEY_V1` from `.env.example`.

Clean-checkout evidence (detached worktree of `e97f1a1`):

- `pnpm install --frozen-lockfile`
- `pnpm db:reset && pnpm db:migrate && pnpm db:seed` (`0001_init` + `0002_auth_outbox` + `0003_staff` + `0004_auth_financial_integrity` + `0005_refund_cap_inbox_recovery`)
- `pnpm verify` twice → both `VERIFY_OK` (142 unit including `tests/adversarial-integrity.test.ts`, `tests/ops-http.test.ts`, `tests/checkout-http.test.ts`, 16 Playwright, 16 simulator)
- GitHub Actions: self-hosted Linux runner (GitHub-hosted minutes remain billing-locked). Workflow pins Node 24.19.0 and pnpm 10.15.1, confirms host PostgreSQL 18, and uploads SBOM/report artifacts with `continue-on-error` because artifact quota previously failed a green verify. Remote conclusion for `e97f1a1` is recorded after the push of this evidence stamp.

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
| Release REL-007–014 | mixed | migrations + dossier | REL-008/011/014 N/A; REL-007 VERIFIED | 0002 additive upgrade; no live host |
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
- Better Auth passkey enrollment is library-pinned; browser ceremony against a real authenticator is operator evidence. Better Auth 1.7.2 has no magic-link plugin; hashed magic links are first-party.
- Next 16 hydration requires CSP `script-src 'unsafe-inline'`; no third-party checkout JS is shipped.
- `next start` uses `NODE_ENV=production`; live-money fail-closed gates key off `PAID_ENV` / `PAID_BUILD_MODE`.
- Adult live lane, real processors, and legal policies remain BLOCKED_EXTERNAL.

## 11. Changed files and migrations

Schema: `0001_init.sql` plus additive `0002_auth_outbox.sql` (`auth_tokens`, unique session token hash, `outbox_jobs.side_effect_at`). HTTP this pass: creator session-gated link create, magic-link issue/consume, guest confirm/dispute/review, mock signed capture, creator deliver/cancel/payouts (payouts fail-closed to step-up), ops hold. Worker: Postgres `FOR UPDATE SKIP LOCKED` lease + skip-send when `side_effect_at` set. Tests: `tests/pg-outbox.test.ts`, Playwright 11 Chromium, fail-closed `NODE_ENV=production` local mock allowed.

## Final status

`PROVIDER_AGNOSTIC_VERIFIED`
