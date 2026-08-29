# Threat Model — Paid platform

**Version:** 1.0  
**Review date:** 2026-08-29  
**Reviewers:** Integrating agent  
**Build mode:** PROVIDER_AGNOSTIC

## Scope and data flow

Public visitor → `/c` `/t` → create-checkout command → mock provider redirect → guest token GET (no consume) → POST exchange → receipt. Creator session → links/fulfillment. Ops separate origin/cookie. Worker processes outbox. Provider webhooks signed.

```
Buyer browser --HTTPS--> web --SQL--> Postgres
Creator browser --HTTPS--> web --SQL--> Postgres
Staff browser --HTTPS--> ops --SQL--> Postgres
Provider --signed webhook--> web inbox --> domain+ledger+outbox
Worker --outbox--> email mock
```

## Assets

| Asset | Sensitivity | Owner/source of truth | Worst credible impact |
|---|---|---|---|
| Guest access token | SECURITY_SECRET | hashed digest | Takeover of one transaction |
| Creator session | SECURITY_SECRET | Better Auth/session table | Account takeover |
| Ledger | CONFIDENTIAL | append-only journal | Financial misstatement |
| Buyer contact | RESTRICTED_IDENTITY | guest credential / email digest | Anonymity break |
| KYC/age raw | RESTRICTED_IDENTITY | identity provider (not stored) | Privacy incident |

## Actors/adversaries

Malicious buyer, fraudulent creator, colluders, ATO attacker, card tester, overprivileged staff, forged webhook, opportunistic internet attacker.

## Entry points

| Entry point | Authentication | Authorization | Rate limit | Data classes | External side effects |
|---|---|---|---|---|---|
| POST /api/transactions/checkout-sessions | public | compliance+reservation | yes | PUBLIC | provider checkout |
| POST /guest/access/:token/continue | token POST | single transaction | yes | SECURITY_SECRET | session cookie |
| POST /api/provider/webhooks/:provider | signature | provider | body limit | provider payload | ledger |
| Creator mutations | session | owner | yes | CONFIDENTIAL | outbox |
| Ops | staff passkey | RBAC | yes | RESTRICTED | dual control |

## Threats and controls

| Threat ID | Scenario | Preconditions | Impact | Preventive controls | Detective controls | Recovery | Test/evidence | Residual risk |
|---|---|---|---|---|---|---|---|---|
| T-01 | Order code used as auth | attacker knows A82F | privacy | guest cookie required | audit | revoke token | tests/security.test.ts | Low |
| T-02 | Scanner consumes magic/guest GET | prefetch GET | lockout | GET peek only | logs | reissue | guest-token tests | Low |
| T-03 | Duplicate webhook double post | replay | double ledger | inbox unique + capture idempotent | recon | compensating | simulator duplicate-webhook | Low |
| T-04 | Redirect treated as paid | return URL | false capture | paid time from provider event | recon | hold | payment truth tests | Low |
| T-05 | Cross-creator IDOR | guess UUID | privacy | owner checks | audit | revoke | creator A vs B test | Low |
| T-06 | PAN/CVV on platform | hosted fields fail | PCI | never accept those fields; log redaction | scans | incident | redaction test | Low |
| T-07 | SSRF via user URL | fetch user URL | network | no arbitrary fetches | n/a | n/a | security test | Low |
| T-08 | Staff universal admin | misconfig | abuse | separated roles, no silent admin | audit | revoke | ops copy/RBAC | Medium |
| T-09 | Cache leak | shared Next cache | cross-user | no-store private routes | header tests | invalidate | next.config headers | Medium |
| T-10 | Unknown provider event ignored | new event type | missed money | retain + alert outbox | ops | recon | unknown-valid-event | Low |

## Abuse cases

Card testing against mock checkout; two-buyer link race; review farming; payout destination swap after recovery; webhook forgery.

## Release blockers

None for PROVIDER_AGNOSTIC besides incomplete verification runs. Live money remains BLOCKED_EXTERNAL.
