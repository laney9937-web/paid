---
name: provider-adapter
description: Apply whenever implementing or changing payment, identity/age, email or payout provider integration and capability routing.
when-to-use: provider adapter Segpay CCBill Verotel KYC age verification checkout webhook payout email
paths:
  - "packages/payments-core/**"
  - "packages/payments-*/**"
  - "packages/identity-*/**"
  - "packages/email-*/**"
  - "packages/compliance/**"
  - "apps/worker/**"
---

The signed provider contract/API documentation and approved provider ADR are authoritative. Public research is not approval.

Read the Bible headings **Build modes**, **Provider adapter and continuity boundary**, **Webhooks and external callbacks**, **Idempotency and replay protection**, **Compliance and jurisdiction policy engine**, and **Business continuity and vendor risk**.

Keep provider semantics isolated behind canonical interfaces. Define capability mapping, event-schema normalization, signature verification, status mapping, idempotency, retries, unknown-event handling, reconciliation and data-classification impact before implementing UI behavior.

Implement contract fixtures and sandbox tests. Never expose provider raw statuses/messages to users or import provider SDK types into domain modules.

When live credentials, underwriting, merchant mapping or approved documentation are absent, implement deterministic mock/contract scaffolding and mark live enablement `BLOCKED_EXTERNAL`.
