---
name: final-verification
description: Mandatory final release-readiness and evidence pass before claiming a milestone or repository complete.
when-to-use: done complete release verify final audit production ready
paths:
  - "**"
---

Read `10_RELEASE_ACCEPTANCE_MATRIX.md`, `11_ACCEPTANCE_TEST_MATRIX.md`, and the Bible headings **Testing strategy**, **Required build outputs**, **Definition of Done**, and **Final Grok reporting format**.

Do not rely on earlier summaries. Re-run from a clean checkout/install/database:

- frozen dependency install and production builds;
- lint/typecheck;
- unit/property/integration/contract/E2E;
- migration fresh and supported upgrade paths;
- security/dependency/secrets scans;
- accessibility and browser matrix;
- outbox/job/concurrency/fault tests;
- ledger/reconciliation invariants;
- backup/restore rehearsal or honest external blocking evidence.

Create the completion dossier under `docs/evidence/`. Mark each requirement `VERIFIED`, `PARTIALLY_VERIFIED`, `IMPLEMENTED_BUT_UNVERIFIED`, `FAILED`, `BLOCKED_EXTERNAL` or `NOT_APPLICABLE`.

Any failed non-live release blocker means the overall provider-agnostic result is not complete. Never turn missing credentials, provider approval or legal review into a pass.
