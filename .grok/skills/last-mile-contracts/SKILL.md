---
name: last-mile-contracts
description: Apply whenever creating or changing domain schemas, transaction links/reservations, API/read models, provider capabilities/events, email-token exchange or the deterministic provider simulator.
when-to-use: schema database value object API contract event reservation link token scanner capability simulator mock provider
paths:
  - "packages/domain/**"
  - "packages/contracts/**"
  - "packages/db/**"
  - "packages/payments-core/**"
  - "packages/payments-mock/**"
  - "packages/provider-simulator/**"
  - "packages/auth/**"
  - "apps/web/**/guest/**"
  - "apps/web/**/checkout/**"
---

Read `13_LAST_MILE_IMPLEMENTATION_CONTRACTS.md`, `09_IMPLEMENTATION_DECISION_LOCK.md`, and the Bible headings **Data modeling and transaction snapshots**, **Canonical state machines**, **Atomicity, concurrency, and background work**, **Provider adapter and continuity boundary**, **Authentication, session, and recovery**, and **API and contract design**.

Do not improvise incompatible table semantics or duplicate provider-specific types. Preserve:

- one active checkout reservation and one successful transaction per link;
- immutable purchase snapshots and provider-authoritative payment/deadline truth;
- BigInt-safe money wire contracts;
- scanner-safe non-mutating GET followed by user-initiated POST token exchange;
- server-side provider capability resolution;
- versioned canonical events and unknown-event handling;
- deterministic simulator scenarios that cannot exist in production.

Run schema/migration, concurrency, contract, token-prefetch, provider-event and production-exclusion tests after changes. Return any required deviation as an ADR, not a silent rewrite.
