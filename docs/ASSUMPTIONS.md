# Assumptions

Schema adapted from `templates/SPEC_GAPS_TEMPLATE.md` (no dedicated assumptions template).

| ID | Temporary assumption | Evidence/reason | How tested | Expiry/revisit trigger | Affected code/data | Status |
|---|---|---|---|---|---|---|
| ASM-001 | Mock fee schedule is 10% platform take + 2.9%+$0.30 processor estimate + 10% reserve | Decision Lock mock clocks/fees until provider ADR | Fee quote unit tests, snapshot tests | Provider fee schedule signed | `packages/config`, snapshots | ACTIVE |
| ASM-002 | Mock descriptor `TRUST*CREATOR` is labeled synthetic | Last-mile §8 | Checkout/receipt copy tests | LIVE-016 | snapshots, UI | ACTIVE |
| ASM-003 | Tax responsibility is `PLATFORM_MOCK_ZERO_TAX` | Last-mile §9 | Snapshot field + fail-closed for UNKNOWN in live | LIVE-013 | compliance/snapshots | ACTIVE |
| ASM-004 | Local runtime may use in-memory UoW for UI while SQL migrations define the system of record | Provider-agnostic demo without live infra | Domain tests + migration invariant tests | Staging Postgres always-on | `apps/web/src/server/store.ts`, `packages/db` | ACTIVE |
| ASM-005 | Better Auth 1.7.2 + passkey plugin 1.7.2 are the current patched 1.6+ line | npm 2026-08-26 | Dependency pin in lockfile | Security advisory | `packages/auth` | ACTIVE |
