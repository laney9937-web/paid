# 09 — Implementation Decision Lock

**Purpose:** Eliminate decisions Grok should not re-litigate during the provider-neutral build.

This file is more specific than the general Bible where it explicitly locks a choice. A signed provider contract or approved legal/compliance ADR may supersede a live-only item; any such change must update this file and traceability.

## Status vocabulary

- **LOCKED_BUILD:** implement now in `PROVIDER_AGNOSTIC` mode.
- **CONFIGURABLE:** implement typed, server-side, versioned configuration with safe mock defaults.
- **BLOCKED_EXTERNAL:** implement interface/mocks/tests now; do not enable real-world behavior without the named external evidence.
- **OUT_OF_SCOPE_V1:** do not build.

These map to the Bible's completion vocabulary. `BLOCKED_EXTERNAL` is never a pass and never applies to provider-independent implementation that can be completed correctly now.

## Product decisions

| Decision | Status | Locked result |
|---|---|---|
| Working public brand | LOCKED_BUILD | `Paid`; brand UI/on-device display may use `Paid`, but legal/store clearance remains an external gate |
| Primary client | LOCKED_BUILD | Mobile-first Web/PWA |
| Native iOS/Android | OUT_OF_SCOPE_V1 | Reconsider after web proof and store-policy review |
| Launch locale | LOCKED_BUILD | `en-US` |
| Launch currency | LOCKED_BUILD | USD; all money stored as integer minor units + ISO currency |
| Launch geography | CONFIGURABLE | US only; checkout allowed only through a server-side approved-jurisdiction allowlist |
| Transaction type | LOCKED_BUILD | Protected purchase only |
| Link semantics | LOCKED_BUILD | Single-use; at most one successful transaction per link |
| Link edits | LOCKED_BUILD | Immutable after activation; cancel and recreate |
| Delivery deadline | LOCKED_BUILD | Begins at provider-authoritative capture/paid time |
| Content delivery | LOCKED_BUILD | External only; platform stores approved metadata, not purchased media |
| Media/file/avatar uploads | OUT_OF_SCOPE_V1 | None; generated initials/identicon only |
| Buyer account | LOCKED_BUILD | Optional after payment |
| Buyer contact | LOCKED_BUILD | Private receipt/recovery email or provider-equivalent channel; hidden from creator |
| Buyer public identity | LOCKED_BUILD | Anonymous or `Verified Buyer`; no legal/public profile |
| Creator public identity | LOCKED_BUILD | Pseudonym; legal identity remains private |
| Creator account | LOCKED_BUILD | Required with provider-neutral verification state |
| Reviews | LOCKED_BUILD | One eligible transaction permits at most one canonical review |
| Public trust vs payout risk | LOCKED_BUILD | Separate engines, models, APIs and visibility |
| Fees | LOCKED_BUILD | Creator-side take rate; buyer sees one final amount from the first price display |
| Search indexing | LOCKED_BUILD | `noindex` during beta for creator profiles and transaction pages |
| Notifications | LOCKED_BUILD | Email only in V1; privacy-safe templates |
| Statement descriptor | CONFIGURABLE | Provider/portfolio-approved copy; synthetic mock only until approval |
| Auto-completion | CONFIGURABLE | Disabled by default; cannot be live-enabled without approved policy/provider rule |
| Tips | OUT_OF_SCOPE_V1 | No |
| Subscriptions | OUT_OF_SCOPE_V1 | No |
| Stored value/wallet/P2P/crypto | OUT_OF_SCOPE_V1 | No |
| Messaging/feed/storefront/discovery | OUT_OF_SCOPE_V1 | No |
| Split sellers/multi-party settlement | OUT_OF_SCOPE_V1 | No |
| Platform-financed instant payout | OUT_OF_SCOPE_V1 | No |
| Arbitrary external URL fetches | OUT_OF_SCOPE_V1 | No |

## Configurable product clocks

Mock defaults exist only to exercise complete flows. They must be server-side, versioned, snapshotted onto applicable transactions, exposed in diagnostics, and visibly identified as mock policy values:

- Link expiry: 7 days after activation.
- Checkout reservation: 15 minutes, subject to provider truth/reconciliation.
- Delivery choices: 24 hours, 48 hours, or 7 days from provider-authoritative capture.
- Creator dispute response: mock 48 hours.
- Review window: mock 30 days.
- Auto-completion: disabled.

A provider/legal product-policy ADR may replace these before live use. Historical transactions continue using their snapshotted policy version.

## Technology baseline — current as of 2026-08-29

| Area | Locked result |
|---|---|
| Runtime | Node.js 24 LTS |
| Web framework | Next.js App Router 16.3.3 minimum patched baseline; install the latest verified compatible 16.x security patch and pin exactly |
| UI runtime | React version required by the pinned Next.js release |
| Language | TypeScript strict |
| Package manager | pnpm workspaces; one exact pnpm version and one lockfile |
| Database | PostgreSQL 18.x latest supported patch; fallback only through ADR |
| ORM/migrations | Drizzle plus explicit SQL migrations and SQL constraints |
| Validation/contracts | Zod plus generated OpenAPI 3.1 |
| Unit/property tests | Vitest + fast-check |
| Browser/E2E | Playwright |
| Accessibility | axe-class automation plus manual keyboard/screen-reader evidence |
| Auth | Better Auth with database sessions, hashed single-use magic links, passkeys, and secure recovery |
| Styling | CSS Modules + explicit tokens; no generic component theme/template |
| Durable work | PostgreSQL transactional outbox + dedicated worker |
| Observability | OpenTelemetry-compatible traces/metrics + structured redacted logs |
| Payments/identity/email | Canonical interfaces + deterministic mocks until provider ADRs |
| Local environment | Docker Compose PostgreSQL; synthetic data only |

Before installation, verify current stable security patches and record exact versions in the lockfile, build manifest, and standards register. Do not use prerelease or `latest` ranges.

## Repository topology

```text
apps/
  web/
  ops/
  worker/
packages/
  auth/
  authorization/
  config/
  db/
  domain/
  payments-core/
  payments-mock/
  identity-core/
  identity-mock/
  email-core/
  email-mock/
  ledger/
  reconciliation/
  trust/
  risk/
  compliance/
  audit/
  observability/
  ui/
  test-support/
docs/
  adr/
  runbooks/
  threat-models/
  requirements/
  standards/
  evidence/
  BUILD_STATUS.md
  ASSUMPTIONS.md
  SPEC_GAPS.md
  traceability.md
```

Package ownership and dependency-direction rules are defined in the Bible and build specification. `apps/ops` is a distinct session/route boundary, not an admin page embedded inside `apps/web`.

## Provider-independent adapters that must be fully built now

- `PaymentProviderAdapter` + deterministic payment simulator.
- `IdentityProviderAdapter` + deterministic creator KYC/age states.
- `EmailProviderAdapter` + local capture/failure/bounce simulator.
- provider event inbox, canonical normalization, idempotency and reconciliation contracts.
- capability matrix and fail-closed behavior for unsupported operations.

Mock adapters must support success, failure, timeout, duplicate, reorder, unknown, delayed and recovery fixtures. A mock that only returns success is incomplete.

## Production fail-closed defaults

Production startup must fail when any applicable condition is true:

- provider mode is `mock` while payment acceptance is enabled;
- live jurisdiction allowlist is empty while checkout is enabled;
- merchant portfolio/provider mapping is absent;
- provider webhook/signature secrets are absent;
- database migrations are pending or schema compatibility check fails;
- restricted-field encryption/key configuration is missing;
- ops strong-auth requirement is disabled;
- audit, worker, outbox or reconciliation health is unavailable;
- live buyer-protection/policy version is not configured;
- live adult lane is enabled without approved provider/compliance configuration;
- a required provider capability is `UNKNOWN` or `UNSUPPORTED`.

## External gates

No live money until written external evidence is recorded for:

- selected processor/acquirer and merchant/submerchant/funds-flow structure;
- external adult-delivery and card-network compliance responsibilities;
- approved creator/buyer KYC and age-verification allocation;
- launch jurisdictions and creator countries;
- real fees, limits, reserves, settlement, refunds, chargebacks and payout rails;
- payout hold/release capabilities and accelerated-payout financing;
- applicable payments/adult/privacy/tax/IP/child-safety/sanctions counsel and provider decisions;
- seller/PSE, creator tax/withholding, sales/use tax, revenue recognition and dormant/unclaimed-funds allocation;
- provider-approved statement descriptor and receipt/support disclosures;
- PCI scope and checkout validation;
- provider-approved legal policies and terms;
- vendor acceptable-use approval for hosting, email, identity/age and observability.

Public research is not approval. Grok must not convert an external gate into a technical assumption.
