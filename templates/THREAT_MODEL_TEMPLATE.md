# Threat Model — [Surface/Feature]

**Version:**  
**Review date:**  
**Reviewers:**  
**Build mode:**

## Scope and data flow

Include actors, components, trust boundaries, external providers and data stores. Add a Mermaid/text diagram.

## Assets

| Asset | Sensitivity | Owner/source of truth | Worst credible impact |
|---|---|---|---|

## Actors/adversaries

Include malicious buyer, fraudulent creator, linked colluders, account-takeover attacker, card tester, overprivileged staff, compromised provider/webhook and opportunistic internet attacker.

## Entry points

| Entry point | Authentication | Authorization | Rate limit | Data classes | External side effects |
|---|---|---|---|---|---|

## Threats and controls

| Threat ID | Scenario | Preconditions | Impact | Preventive controls | Detective controls | Recovery | Test/evidence | Residual risk |
|---|---|---|---|---|---|---|---|---|

Cover at minimum object/property/function authorization, token leakage/replay, XSS/CSRF/SSRF/injection, webhook forgery/reorder, payout takeover, review farming, transaction laundering, provider outage, admin abuse and sensitive identity linkage.

## Abuse cases

Describe end-to-end attacker goals, not only technical vulnerabilities.

## Release blockers

List unresolved Critical/High findings and required acceptance owner.
