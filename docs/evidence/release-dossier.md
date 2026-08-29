# Provider-Agnostic Release Dossier

**Commit:** local working tree (see git log after first commit)  
**Build artifact/digest:** Next.js 16.3.3 production builds of web/ops; worker tsc dist  
**Schema/migration version:** `0001_init`  
**Dependency lock digest:** `docs/evidence/sbom.json`  
**Build mode:** `PROVIDER_AGNOSTIC`  
**Prepared by:** Integrating agent  
**Review date:** 2026-08-29

## Scope delivered

Milestones 0–7 implemented as vertical slices with domain commands, SQL constraints, mock adapters, creator/guest/ops UI, worker outbox, and `pnpm verify`.

## Reproducibility

```bash
nvm use 24.19.0
pnpm install --frozen-lockfile
pnpm db:up
# wait until postgres is ready
pnpm db:migrate
pnpm db:seed
pnpm verify
```

Environment prerequisites: Node 24 LTS, pnpm 10.15.1, Docker Compose PostgreSQL 18.6.

## Verification results

| Gate group | Passed/total | Evidence path | Status | Notes |
|---|---:|---|---|---|
| Build | 9/9 non-live | verify-1.log verify-2.log | VERIFIED | |
| Product | 10/10 | e2e + domain | VERIFIED | |
| Authorization/auth | matrix AUTHZ/AUTH | vitest | VERIFIED | |
| Privacy/compliance | PRIV/COMP | vitest + headers | VERIFIED | |
| Payments/ledger/reconciliation | PAY/LEDGER | simulator + journals | VERIFIED | |
| Trust/risk/reviews | TRUST/RISK | vitest | VERIFIED | |
| Security | SEC-* except independent pentest | tests/security + axe | VERIFIED / SEC-010 N/A→LIVE-010 | |
| UX/accessibility/performance | UX/ACC/PERF | playwright + load-smoke | Chromium verified | |
| Reliability/operations | REL/OPS | worker, fail-closed, runbooks | REL-011/014 N/A live host | |

## Financial invariants

Capture journals balance; reserve is a liability; duplicate webhooks do not double-post; partial refund cannot exceed refundable; late capture after timeout is applied.

## Security/privacy review

No PAN/CVV fields; guest tokens hashed; order code not auth; creator DTO allowlist; private Cache-Control; ops isolated origin/cookie name; scanner GET does not consume.

## Browser/UX evidence

Playwright Chromium: `/c/maya` and `/ops/sign-in` with axe-core (no critical/serious). Screenshots optional under scratch.

## External live gates

Each `LIVE-*` and `LIVE-BRAND-*` item is `BLOCKED_EXTERNAL` in `docs/SPEC_GAPS.md` and `docs/traceability.md`. None were self-approved.

## Known limitations

- Web/ops mutations commit through a PostgreSQL unit of work (domain + ledger + audit + outbox in one transaction).
- Independent pentest, PITR restore drill, and multi-browser/PWA install evidence remain operator/live gates.
- Adult live lane, real processors, and legal policies remain BLOCKED_EXTERNAL.

## Final status

`PROVIDER_AGNOSTIC_VERIFIED`
