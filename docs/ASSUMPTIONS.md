# Assumptions

Schema adapted from `templates/SPEC_GAPS_TEMPLATE.md` (no dedicated assumptions template).

| ID | Temporary assumption | Evidence/reason | How tested | Expiry/revisit trigger | Affected code/data | Status |
|---|---|---|---|---|---|---|
| ASM-001 | Mock fee schedule is 10% platform take + 2.9%+$0.30 processor estimate + 10% reserve | Decision Lock mock clocks/fees until provider ADR | Fee quote unit tests, snapshot tests | Provider fee schedule signed | `packages/config`, snapshots | ACTIVE |
| ASM-002 | Mock descriptor `TRUST*CREATOR` is labeled synthetic | Last-mile §8 | Checkout/receipt copy tests | LIVE-016 | snapshots, UI | ACTIVE |
| ASM-003 | Tax responsibility is `PLATFORM_MOCK_ZERO_TAX` | Last-mile §9 | Snapshot field + fail-closed for UNKNOWN in live | LIVE-013 | compliance/snapshots | ACTIVE |
| ASM-004 | Web/ops mutations run through `withPostgresUow` so domain+ledger+audit+outbox share one DB transaction | Evaluator/last-mile atomicity | `tests/pg-uow.test.ts` rollback + capture journal | none | `packages/db/src/postgres-uow.ts` | ACTIVE |
| ASM-005 | Better Auth 1.7.2 + passkey plugin 1.7.2 are the current patched 1.6+ line | npm 2026-08-26 | Dependency pin in lockfile | Security advisory | `packages/auth` | ACTIVE |
| ASM-006 | Next 16 production hydration needs CSP `script-src 'unsafe-inline'`; no third-party checkout scripts are shipped | Playwright React #412 / blocked inline bootstrap | tests/e2e/guest-checkout.spec.ts; H-05 | Next nonce-capable CSP or stricter runtime | `apps/web/next.config.ts`, `apps/ops/next.config.ts` | ACTIVE |
| ASM-007 | Fail-closed live-money gates use `PAID_ENV` / `PAID_BUILD_MODE`, not `NODE_ENV`, because `next start` always sets `NODE_ENV=production` | L-01 still rejects `PAID_ENV=production` + mock checkout | packages/config/src/fail-closed.test.ts | PRODUCTION_MONEY mode | `packages/config/src/fail-closed.ts` | ACTIVE |
| ASM-008 | Better Auth 1.7.2 has no magic-link plugin; hashed single-use tokens are first-party in `auth_tokens` and mounted next to BA passkey | package source + AUTH-001 | issueMagicLink/consumeMagicLink + HTTP routes | BA magic-link plugin if added upstream | `packages/db/src/auth-store.ts`, `packages/auth` | ACTIVE |
