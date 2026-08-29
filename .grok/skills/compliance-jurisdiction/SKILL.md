---
name: compliance-jurisdiction
description: Apply whenever changing creator eligibility, adult/non-adult lane, jurisdiction, agreements, reporting, compliance cases or checkout eligibility.
when-to-use: compliance jurisdiction state country adult age KYC agreement AUP prohibited content trust safety checkout eligibility
paths:
  - "packages/compliance/**"
  - "packages/identity-*/**"
  - "apps/ops/**/compliance/**"
  - "apps/web/**/onboarding/**"
  - "apps/web/**/report/**"
---

Read the Bible headings **Frozen provider-independent V1 decisions**, **Transaction snapshots**, **Compliance and jurisdiction policy engine**, **Privacy engineering and data governance**, and **Admin, support, and operations**, plus `09_IMPLEMENTATION_DECISION_LOCK.md`.

Compliance outcomes are typed `ALLOW`, `DENY`, or `REVIEW` with policy version and reason codes. Missing or unknown required state fails closed. Adult/non-adult routing is provider/merchant configuration, not a cosmetic UI boolean.

Never invent live legal rules. Use deterministic mock jurisdictions and verification states in provider-agnostic mode. Mark provider/counsel-dependent enablement `BLOCKED_EXTERNAL`.

Test revoked/expired verification, policy-version change, disallowed jurisdiction, prohibited-use report, link suspension, payout hold and non-leakage of internal reason codes.
