# ADR-001 — Locked PROVIDER_AGNOSTIC stack pins

**Status:** Approved  
**Date:** 2026-08-29  
**Decision owners:** Integrating agent  
**External approvals required:** none for mock mode

## Context

Bible and Decision Lock require Node 24 LTS, Next.js 16.3.3+ patched, PostgreSQL 18.x, Drizzle, Better Auth 1.6+, Zod, CSS Modules, Pino, OTel, Vitest, Playwright, axe-core, fast-check.

## Decision

Pin Next.js 16.3.3, React 19.2.8, Better Auth 1.7.2, Drizzle 0.45.2, Zod 4.5.4, TypeScript 5.9.3, PostgreSQL 18.6 image. No prerelease ranges.

## Consequences

Lockfile is authoritative. Substitutions require a new ADR with tests.

## Verification

`pnpm install --frozen-lockfile` and `pnpm verify`.
