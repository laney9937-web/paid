---
name: financial-integrity
description: Apply whenever editing payments, webhooks, refunds, disputes, payouts, balances, ledger or reconciliation.
when-to-use: payment webhook refund chargeback payout balance ledger reconciliation idempotency
paths:
  - "packages/payments-*/**"
  - "packages/ledger/**"
  - "packages/reconciliation/**"
  - "packages/db/**"
  - "apps/worker/**"
---

Read the Bible headings **Canonical state machines**, **Atomicity, concurrency, and background work**, **Provider adapter and continuity boundary**, **Webhooks and external callbacks**, **Idempotency and replay protection**, **Financial ledger and reconciliation**, and **Testing strategy**, plus `11_ACCEPTANCE_TEST_MATRIX.md`.

Before editing, list affected state machines, financial postings, idempotency keys, concurrency controls, provider events, outbox jobs and reconciliation paths.

Never:

- trust browser redirect as payment success;
- mutate a stored balance to correct history;
- perform a provider network call while holding a long database lock;
- create a money side effect without idempotency/outbox;
- swallow unknown provider events;
- let duplicate/out-of-order events double-post;
- claim a financial flow is verified without real-database and concurrency tests.

After changes, run unit, property, real-database integration, concurrency, state-model and ledger-invariant tests. Search every sibling financial command for the same defect pattern.
