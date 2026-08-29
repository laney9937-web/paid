# AGENTS.md

## Mission

Build the complete provider-agnostic V1 of **Paid**, the trust-first creator transaction platform. This repository is a financial/trust system, not a visual prototype exercise.

Read the numbered root documents in order through `14_BRAND_NAME_AND_STORE_METADATA.md`. The authoritative engineering rules are in `03_GROK_BUILD_BIBLE.md`; the frozen implementation decisions are in `09_IMPLEMENTATION_DECISION_LOCK.md`; exact schema/API/event/reservation/token/provider-simulator mechanics are in `13_LAST_MILE_IMPLEMENTATION_CONTRACTS.md`; the verification contracts are `10_RELEASE_ACCEPTANCE_MATRIX.md` and `11_ACCEPTANCE_TEST_MATRIX.md`. Use `templates/` when creating repository governance/evidence documents.

## Current mode

`PROVIDER_AGNOSTIC` — deterministic payment, identity/age and email mock adapters only. No live money, production credentials or fabricated provider integration.

## Work behavior

- Continue through implementation, adversarial review and verification; do not stop after a plan, scaffold or first passing build.
- Resolve reversible decisions from the governing files and record them in ADRs when required.
- Record genuine provider/legal/credential unknowns as `BLOCKED_EXTERNAL`.
- Copy/adapt the schemas in `templates/` rather than inventing incompatible evidence formats; keep `docs/BUILD_STATUS.md`, `docs/ASSUMPTIONS.md`, `docs/SPEC_GAPS.md` and `docs/traceability.md` current.
- Treat AI-generated code as untrusted until exercised by the required tests and review passes.
- Never weaken security, privacy, authorization, ledger, audit or financial invariants merely to make a test pass.
- Use the repository `.grok/skills/` whenever their trigger/path applies, including the last-mile contracts skill for domain/schema/API/provider work.
- Specialized subagents may review in parallel, but one integrating agent remains responsible for resolving contradictions and rerunning the complete verification suite.

## Required completion command

Create `pnpm verify` that runs every automatable non-live gate from the release matrix. Final provider-agnostic delivery requires it to pass from a clean checkout and requires the evidence/status dossier defined in the Bible.

## Completion boundary

You may finish with only `LIVE-*` items marked `BLOCKED_EXTERNAL`. Any non-live requirement that is merely planned, scaffolded or untested means the repository is not complete.
