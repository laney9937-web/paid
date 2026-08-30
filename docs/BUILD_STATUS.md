# Build Status

**Build mode:** `PROVIDER_AGNOSTIC`  
**Commit:** `7a86e58d107bf77ab16fd04fa21982236a5d9cab` (`repair/auth-financial-trust-integrity`)  
**Last updated:** 2026-08-30  
**Owner/integrating agent:** Grok Build integrating agent

A git commit cannot contain its own object id. This dossier names the dual-verified, Actions-green tree. Confirm with `git merge-base --is-ancestor 7a86e58d107bf77ab16fd04fa21982236a5d9cab HEAD` and `git diff --stat 7a86e58d107bf77ab16fd04fa21982236a5d9cab HEAD` (evidence paths only).

## Overall status

`PROVIDER_AGNOSTIC_REPAIR` — dual clean-checkout `pnpm verify` of `7a86e58d107bf77ab16fd04fa21982236a5d9cab` both `VERIFY_OK` (142 unit, 16 Playwright, 16 simulator). GitHub Actions run [33298797636](https://github.com/laney9937-web/paid/actions/runs/33298797636) `conclusion=success` on that SHA. Artifact upload did not persist: `Failed to CreateArtifact: Artifact storage quota has been hit`; workflow step is `continue-on-error`; `total_count=0`. SBOM remains `docs/evidence/sbom.json` in git. PR https://github.com/laney9937-web/paid/pull/2 stays open. Provider-agnostic mock boundary unchanged: no Segpay/CCBill/Verotel, no live money.

## What this repair changed

- Session rows persist auth method/strength/timestamps; magic-link stays `EMAIL_LINK`; privileged ops mutations require a real `STEP_UP`/`PASSKEY` session or return `STEP_UP_REQUIRED` (Option B — no fake passkey upgrade).
- Typed `staff_role_grants` (SUPPORT/DISPUTES/RISK/COMPLIANCE/PAYMENTS/SECURITY). Audit copies verified session actor/roles/strength/session id.
- One-time secrets (guest access, magic-link continue URLs) are AES-256-GCM envelope-encrypted. Idempotency JSON and outbox JSON store envelope ids, not raw tokens.
- Checkout idempotency key is required (not invented). PayForm reuses one key per share id via `sessionStorage`.
- Payout request reserves payable (`PAYOUT_RESERVED`); `PAYOUT_PAID` journals once on the provider event. Refund request does not journal; `REFUND_SUCCEEDED` journals once with `sourceId = refundId`.
- Exhaustive provider-event outcomes: APPLIED / DUPLICATE / STORED_PENDING_DEPENDENCY / RECONCILIATION_REQUIRED / UNKNOWN_ALERTED / REJECTED_INVALID.
- Additive migrations `0004_auth_financial_integrity` and `0005_refund_cap_inbox_recovery` (refund cap trigger).
- Ledger-derived balances; failed/cancelled txs do not inflate pending. MOCK fee v2: 5% creator, 3.9%+$0.49 buyer protection cap $4.99, min $20.
- Public GET does not create demo links; production web has no `@paid/test-support`; verification mark and HIGH TRUST are gated on real identity/unique-buyer evidence.
- Checkout body is a strict schema; client geo is not trusted. Inbox `processed_at` is terminal-only with pending recovery. PAYOUT_FAILED after PAID is recon. Concurrent full refunds cannot both REQUESTED.
- Role-gated ops consoles with hold/restrict/recon/inbox/outbox mutations (reason + idempotency + step-up). GitHub Actions Node 24.19.0 / pnpm 10.15.1 / host PostgreSQL 18 / migrate / seed / `pnpm verify` / secret scan / SBOM; artifact upload remains quota-blocked.

## Milestones

| Milestone | Scope | Status | Evidence | Blocking issue | Next action |
|---|---|---|---|---|---|
| 0 | Preflight/governance | VERIFIED | docs/*, ADR-001, traceability | none | none |
| 1 | Reproducible foundation | VERIFIED | pnpm workspace, compose PG 18.6, drizzle SQL, pnpm verify | none | none |
| 2 | Auth/onboarding | VERIFIED | hashed tokens, envelope magic-link, session facts | none | none |
| 3 | Creator/public product | VERIFIED | create-link e2e, truthful trust | none | none |
| 4 | Guest privacy/mock checkout | VERIFIED | guest GET/POST, stable idempotency | none | none |
| 5 | Fulfillment/disputes/reviews | VERIFIED | domain commands + acceptance-matrix D/E | none | none |
| 6 | Financial integrity/risk | VERIFIED | request≠paid, event outcomes, 0004/0005 | none | none |
| 7 | Ops/reliability/verification | VERIFIED | role-gated consoles + mutations, dual-verify 7a86e58 | GitHub artifact quota (upload not persisted) | keep PR open |
| 8 | Provider sandbox | BLOCKED_EXTERNAL | | Provider ADR/credentials | wait LIVE-009 |
| 9 | Live money | BLOCKED_EXTERNAL | | LIVE gates | wait |

## Verification summary

| Check | Command/evidence | Result | Last run |
|---|---|---|---|
| Unit | `pnpm test` | PASS (142) | 2026-08-30 |
| Property/contract/integration/migrations/security | pnpm scripts | PASS | 2026-08-30 |
| Simulator | `pnpm mock:scenario -- --name all` | PASS (16) | 2026-08-30 |
| Secret scan | `node scripts/secret-scan.mjs` | PASS | 2026-08-30 |
| Dual clean-checkout `pnpm verify` | detached worktree of `7a86e58d107bf77ab16fd04fa21982236a5d9cab` | VERIFY_OK twice (142 unit, 16 Playwright, 16 simulator) | 2026-08-30 |
| GitHub Actions | `.github/workflows/verify.yml` run [33298797636](https://github.com/laney9937-web/paid/actions/runs/33298797636) | `conclusion=success` on `7a86e58d107bf77ab16fd04fa21982236a5d9cab`. Upload reports errored `Failed to CreateArtifact: Artifact storage quota has been hit`; artifacts `total_count=0` | 2026-08-30 |

## Honest NOT_APPLICABLE (non-live)

| ID | Rationale |
|---|---|
| SEC-010 | Independent pentest is LIVE-010 and cannot be self-approved |
| ACC-002 | Dedicated screen-reader session is an operator gate; axe + keyboard focus are automated |
| UX-006 | WebKit/Firefox/installed-PWA need operator devices; Chromium is automated. Manifest has no icons; PWA installability is not claimed complete |
| REL-008 | No V1 historical backfill jobs |
| REL-011 | PITR restore requires a live host |
| REL-014 | Production cutover is out of scope for PROVIDER_AGNOSTIC |
| C-09 / L-03 / L-04 | Same live-host restore gate as REL-011 |

## Open failures

| ID | Severity | Symptom | Root cause | Owner | Regression test | Status |
|---|---|---|---|---|---|---|

## External blockers

| LIVE ID | Evidence required | Owner | Status | Last contact/update |
|---|---|---|---|---|
| LIVE-001–016, LIVE-BRAND-* | See docs/SPEC_GAPS.md | External | BLOCKED_EXTERNAL | 2026-08-29 |

## Deviations

| Item | Choice | Why |
|---|---|---|
| Passkey step-up | Option B: persist `STEP_UP` session rows; return `STEP_UP_REQUIRED` without a fake upgrade UI | Real WebAuthn ceremony is not CI-completable here; fabricating PASSKEY from EMAIL_LINK is forbidden |
| PWA | Manifest + SW that skips private routes; no install icons | Do not claim installable PWA without icons/offline public cache |
| Founder Boost | SPEC_GAPS GAP-003 only | Not a provider-agnostic mock ledger feature |
