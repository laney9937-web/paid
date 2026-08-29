# 13 — Last-Mile Implementation Contracts

**Version:** 1.0  
**Authority:** Exact provider-neutral mechanics for the V1 build. This file clarifies the Bible and Decision Lock; it cannot weaken them or invent live provider/legal behavior.

## 1. Canonical value objects

### Money

Domain and database arithmetic uses signed 64-bit/big-integer minor units. JSON/OpenAPI serializes minor units as a base-10 string to avoid floating-point loss.

```ts
type Currency = 'USD';
type Money = Readonly<{ amountMinor: bigint; currency: Currency }>;
type MoneyWire = Readonly<{ amountMinor: string; currency: Currency }>;
```

Reject non-integer wire values, unsupported currencies, overflow, and arithmetic across currencies. Formatting is presentation-only.

### Actor context

```ts
type ActorContext = Readonly<{
  actorType: 'PUBLIC' | 'GUEST' | 'CREATOR' | 'OPS' | 'WORKER' | 'PROVIDER';
  actorId?: string;
  creatorId?: string;
  guestTransactionId?: string;
  sessionId?: string;
  authStrength: 'NONE' | 'EMAIL_LINK' | 'PASSKEY' | 'STEP_UP' | 'SERVICE';
  requestId: string;
}>;
```

Authorization services consume `ActorContext`; handlers do not infer authority from URL IDs or client fields.

### Identifiers

- Internal primary IDs: UUIDv7, or one documented sortable random equivalent, generated server-side.
- Public order code: 10-character uppercase Crockford Base32, unique, non-secret, never authorization.
- Shareable transaction-link ID: at least 128 bits of random entropy; it identifies the offered transaction but does not grant private receipt access.
- Guest/magic/recovery token: at least 256 bits of random entropy; store only `HMAC-SHA-256(keyVersion, token)` plus metadata.
- Provider IDs: stored verbatim as provider-scoped opaque strings; never parsed for business meaning.

## 2. Transaction-link immutability and reservation

### Link facts

On activation, snapshot creator, amount, currency, category, delivery duration, lane, policy versions, statement-descriptor configuration and provider configuration. Activated terms cannot be edited. Cancel-and-recreate is the only change path.

### Required reservation record and constraints

`checkout_reservations` minimally contains: ID, link ID, transaction ID, idempotency scope/key hash, state, provider configuration, provider checkout ID if known, created/expires timestamps, last provider truth check and version.

Database constraints enforce:

- one nonterminal reservation per link;
- one captured/successful transaction per link;
- unique provider checkout/payment IDs within provider configuration;
- unique idempotency key within actor/operation scope.

### Create-checkout algorithm

1. Validate creator, link, policy, jurisdiction, compliance and limits server-side.
2. Begin a DB transaction and lock/version-check the link.
3. If the same idempotent command already exists, return its existing result.
4. If the link is `USED`, terminal, or has another nonterminal reservation, return the stable appropriate error.
5. Create the transaction snapshot, `RESERVED` reservation, idempotency record and audit/outbox records; commit.
6. Call the provider **outside** the database lock using persistent provider idempotency.
7. In a new DB transaction, attach provider checkout truth and transition to provider-created state, or record a definite failure.
8. For timeout or unknown outcome, set `RECONCILIATION_HOLD`; do not reopen the link.
9. Release back to `ACTIVE` only after provider API/reconciliation proves no payment or provider checkout can succeed.
10. Any later verified payment success consumes the link and becomes canonical, even if the local reservation timer expired or the creator requested cancellation while payment was pending.

The losing concurrent buyer receives `LINK_RESERVED` or `LINK_USED`; no identity or existence details beyond what the public link already reveals.

## 3. Canonical paid time and deadline

`providerAuthoritativePaidAt` is chosen by the adapter from the provider's signed or API-confirmed occurrence time. Webhook receipt, browser return, link creation and local checkout creation are not paid time.

```text
deliveryDeadlineAt = providerAuthoritativePaidAt + snapshottedDeliveryDuration
```

If the provider later corrects paid time, emit `PAYMENT_PAID_TIME_CORRECTED`, preserve old/new value and source, recompute under a documented policy, and notify affected parties if material. Never silently update it.

## 4. Canonical provider event envelope

```ts
type CanonicalProviderEvent = Readonly<{
  canonicalEventId: string;
  provider: string;
  providerConfigurationId: string;
  adapterVersion: string;
  schemaVersion: number;
  eventType: string;
  providerEventId: string;
  providerResourceType:
    | 'CREATOR'
    | 'CHECKOUT'
    | 'PAYMENT'
    | 'REFUND'
    | 'DISPUTE'
    | 'PAYOUT'
    | 'SETTLEMENT'
    | 'UNKNOWN';
  providerResourceId: string;
  occurredAt: string;
  receivedAt: string;
  amount?: MoneyWire;
  rawPayloadDigest: string;
  verificationKeyVersion: string;
  normalizedData: unknown;
}>;
```

Unknown but valid events are retained and alerted; they are not coerced into a known type.

Webhook rotation accepts only configured current/previous key versions during a bounded overlap. After retirement, old signatures fail. The raw-body digest and verifying-key version are auditable.

## 5. API success/error envelope

Success:

```json
{ "data": {}, "meta": { "requestId": "...", "version": 1 } }
```

Error:

```json
{
  "error": {
    "code": "LINK_RESERVED",
    "message": "This transaction is currently in progress.",
    "retryable": true,
    "requestId": "..."
  }
}
```

Stable public codes include:

`VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `LINK_INACTIVE`, `LINK_RESERVED`, `LINK_USED`, `COMPLIANCE_REVIEW`, `JURISDICTION_BLOCKED`, `LIMIT_EXCEEDED`, `STEP_UP_REQUIRED`, `IDEMPOTENCY_CONFLICT`, `PROVIDER_UNAVAILABLE`, `PAYMENT_PENDING`, `PAYMENT_UNKNOWN`, `STATE_CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

Provider/raw risk errors stay internal. Responses never reveal whether another creator, buyer or account exists beyond allowed public information.

## 6. Scanner-safe email and guest-link exchange

Automated scanners, previewers and prefetchers may issue `GET`. Therefore:

1. An email URL `GET` never consumes the one-time token, creates an authenticated session, accepts terms, confirms delivery, or mutates financial/product state.
2. `GET` validates only enough to create or refresh a short-lived HttpOnly continuation cookie keyed to the token digest, then redirects to a clean confirmation page.
3. The user deliberately submits a same-site `POST` protected by CSRF/origin checks.
4. The `POST` atomically consumes the token and creates the least-privilege session.
5. Replays show a safe used/expired/reissue path.
6. Responses use `Cache-Control: no-store`; token and continuation values are excluded from logs, analytics, referrers and error payloads.
7. Security tests simulate multiple scanner GETs before the real user POST.

No irreversible action in the product uses GET.

## 7. Deterministic provider simulator

Create `packages/provider-simulator` with:

- injected fake clock;
- fixed scenario seed;
- event queue/inbox view;
- provider resource state;
- command history;
- CLI `pnpm mock:scenario -- --name <scenario>`;
- local/test-only ops surface `/ops/system/provider-simulator`;
- JSON scenario fixtures committed to `test-support`.

Required named scenarios:

- `happy-path`
- `decline`
- `provider-timeout-unknown`
- `late-success-after-timeout`
- `duplicate-webhook`
- `out-of-order-events`
- `unknown-valid-event`
- `invalid-signature`
- `key-rotation-overlap`
- `partial-then-full-refund`
- `chargeback-after-payout`
- `payout-failure-and-retry`
- `identity-review-rejected`
- `email-bounce`
- `email-link-scanner-prefetch`
- `two-buyers-one-link-race`

Simulator code is guarded by build-time and runtime checks. Production startup fails if it is enabled; production routes return 404; simulator packages have no production credentials or external network access.

## 8. Statement descriptor

Provider configuration contains a versioned approved descriptor and support text. The transaction snapshot records the exact descriptor represented to the buyer. Checkout, confirmation, receipt and support lookup use the same snapshot value.

Mock descriptor: `TRUST*CREATOR`, visibly labeled synthetic/non-live.

A descriptor may be discreet, but it must not be misleading. The live value is `BLOCKED_EXTERNAL` pending provider approval.

## 9. Tax responsibility capability

```ts
type TaxResponsibility = 'PROVIDER' | 'PLATFORM' | 'CREATOR' | 'UNKNOWN';
```

Each enabled provider configuration + jurisdiction + transaction category resolves responsibility, policy version, tax amount and evidence source. Provider-agnostic mode uses `PLATFORM_MOCK_ZERO_TAX` explicitly. Production checkout fails closed where responsibility remains `UNKNOWN`.

Do not invent tax calculation, nexus, digital-goods classification or marketplace-facilitator treatment. Those are `LIVE-*` external decisions.

## 10. Failed payouts and unclaimed creator payables

The ledger keeps creator liabilities until valid payout, refund/offset, authorized adjustment or legally approved remittance. It never recognizes aged/unclaimed funds as revenue automatically.

Build provider-neutral:

- failed-payout reason and retry state;
- last verified creator contact/payout destination;
- payable aging buckets;
- due-diligence/contact events;
- case assignment and hold;
- export/report interface for a future state policy;
- audit trail for any disposition.

Dormancy periods, owner-address rules, reporting/remittance and provider-versus-platform responsibility remain `BLOCKED_EXTERNAL`.

## 11. Risk governance and appeal

Risk features have an allowlist, data purpose, owner, version and retention. Protected characteristics and unjustified demographic proxies are prohibited. Adult/non-adult lane is a compliance/merchant-routing fact, not a fraud verdict.

For material restrictions:

- retain internal reason codes and evidence;
- show a safe high-level user reason where allowed;
- provide a support/review path;
- record appeal, reviewer, evidence, outcome and expiry;
- time-bound manual overrides;
- never allow appeal/override to bypass sanctions, provider or legal blocks.

Test for accidental use of prohibited fields in rule configuration and feature extraction.

## 12. Required minimum table fields

Every mutable table includes `id`, `created_at`, `updated_at` and `version` where optimistic concurrency applies. Financial/audit/event tables are append-only and omit `updated_at` except processing metadata.

Minimum high-value records:

- `transaction_links`: creator, public/share ID, state, immutable terms hash, activation/expiry/cancel times, version.
- `checkout_reservations`: link, transaction, state, idempotency reference, provider config/checkout reference, expiry, truth-check time, version.
- `transactions`: link, creator, public order code, lane, provider config, amount/currency, snapshot ID, canonical paid/deadline times.
- `payment_attempts`: transaction, provider scope/IDs, state, amount, idempotency reference, last truth check.
- `provider_events_inbox`: provider event ID, key version, raw digest/body reference, signature result, normalized version/type, occurred/received/processed times and outcome.
- `guest_transaction_credentials`: transaction, token digest/key version, purpose, expiry, consumed/revoked times.
- `risk_decisions`: subject/scope, rule version, outcome, reason codes, inputs digest, expiry and override/appeal references.
- `trust_snapshots`: creator, algorithm version, input-aggregates digest, public outputs and effective time.
- `ledger_entries/postings`: immutable entry ID/time/source; account, debit/credit, amount/currency; balancing invariant.
- `audit_events`: actor/context, action, subject, before/after digests where permitted, reason/case, timestamp and correlation.

Database names may vary only through an ADR; invariants and traceability may not.
