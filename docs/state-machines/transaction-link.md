# State Machine — Transaction link

**Owner package/table:** `packages/domain` / `transaction_links`  
**Version:** 1  
**Authoritative external source (if any):** Bible §10.2, last-mile §2

## States

| State | Meaning | Terminal? | User-visible label | Allowed actors |
|---|---|---|---|---|
| DRAFT | not offered | N | Draft | creator |
| ACTIVE | shareable | N | Active | public checkout |
| USED | successful payment | Y | Used | none new |
| EXPIRED | past expiry, no payment | Y | Expired | none |
| CANCELLED | creator cancelled | Y | Cancelled | none new |
| DISABLED | T&S | Y | Unavailable | none |

## Transitions

| From | Command/event | To | Preconditions | Atomic writes | Ledger effect | Audit event | Outbox jobs | Idempotency key | Failure/retry behavior |
|---|---|---|---|---|---|---|---|---|---|
| DRAFT | ACTIVATE | ACTIVE | creator active | link | none | LINK_CREATED | none | n/a | reject |
| ACTIVE | USE | USED | payment captured | link+tx | capture journal | PAYMENT_CAPTURED | email/trust | provider event | replay ok |
| ACTIVE | CANCEL | CANCELLED | no capture | link | none | LINK_CANCELLED | none | n/a | reject if used |
| ACTIVE | EXPIRE | EXPIRED | no nonterminal reservation | link | none | LINK_EXPIRED | none | n/a | skip if reserved |

## Invariants

One successful captured transaction per link. One nonterminal reservation per link.

## Late/out-of-order events

Late capture after timeout still consumes the link.

## Tests

`packages/domain/src/commands/create-checkout.test.ts`, simulator `two-buyers-one-link-race`.
