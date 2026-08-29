# 05 — Closed Beta Operating Plan

## Objective

Prove that people understand and value **trusted pseudonymous transactions** while learning real fraud/dispute/payout behavior at deliberately limited financial exposure.

Do not optimize beta for GMV. Optimize for successful protected transactions, operational learning and processor stability.

## Entry gates

Beta does not accept real funds until:

- provider signs off on exact model;
- provider account/MID/submerchant structure live;
- required creator compliance documents approved;
- checkout/PCI scope approved;
- payment webhooks verified;
- ledger/reconciliation functioning;
- refund/dispute operations tested;
- creator agreement/AUP/privacy/protection policies approved;
- fraud/card-testing controls live;
- payout holds/reserve behavior understood;
- security review complete.

## Cohort

Start with **10–25 manually approved creators**.

Selection:

- demonstrable existing creator presence;
- adult and/or ordinary lane only where processor approved;
- willing to provide high-quality feedback;
- moderate ticket sizes;
- no obvious prohibited activity;
- geographically inside approved launch footprint.

Avoid one creator dominating the entire beta volume.

## Initial controls

Final limits are provider-dependent. Internal defaults should be conservative and never exceed processor limits.

Possible internal beta guardrails:

- low per-transaction cap;
- weekly cap per creator;
- no platform-financed instant payout;
- all payout acceleration disabled initially;
- manual review for unusual volume;
- payout destination changes cause hold;
- adult creator onboarding manually reviewed;
- every dispute manually adjudicated;
- daily reconciliation.

## Beta transaction operations

Every business day:

1. reconcile all prior provider activity;
2. review unmatched/missing events;
3. review payment decline/fraud spikes;
4. review creator volume anomalies;
5. review open disputes;
6. review payout holds/failures;
7. sample successful transactions for state integrity;
8. review support feedback;
9. document any new failure pattern.

## Support SLA targets

- payment-access/security issue: rapid same-day triage;
- active commercial dispute: acknowledge same business day;
- illegal/underage/non-consensual report: immediate Trust & Safety escalation;
- reconciliation break: operations incident, not ordinary support ticket.

## Metrics dashboard

### Product
- creator verification -> first link rate;
- median create-link time;
- link open -> checkout start;
- checkout start -> paid;
- paid -> completed;
- buyer account optional signup;
- repeat creator rate;
- repeat buyer rate.

### Trust
- review eligibility -> review submitted;
- review fraud/moderation rate;
- unique buyers per creator;
- trust tier distribution;
- buyer-reported trust/confidence survey.

### Risk/payments
- auth decline rate;
- processor fraud rejection;
- internal dispute rate;
- chargeback rate;
- refund rate;
- fraud loss/GMV;
- average ticket;
- payout failures;
- reconciliation breaks.

### Economics
- gross payment volume;
- processor cost;
- platform fee revenue;
- variable KYC/age/fraud/support cost;
- losses;
- contribution per transaction and per creator.

## Qualitative research questions

Ask buyers:

- Did the trust profile make you more comfortable paying?
- Did you understand what protection meant?
- Was anonymous-to-creator privacy valuable?
- What information did you expect to see but didn't?
- Was checkout faster/slower than current methods?

Ask creators:

- Did the trust link help close transactions?
- Did buyers ask fewer legitimacy questions?
- Did privacy feel sufficient?
- Was create-link fast enough?
- How important is faster payout progression?
- Which transaction details felt invasive/unnecessary?

## Stage gates

### Gate A — 100 completed protected transactions
Need:

- zero unexplained ledger breaks;
- correct state transitions;
- support workflow functioning;
- no severe security/privacy incident.

### Gate B — first meaningful dispute cohort
Do not automate dispute decisions until real cases validate categories/evidence.

### Gate C — one full chargeback-risk window
Only after observing delayed fraud/chargeback behavior should payout timing loosen.

### Gate D — faster payout experiment
Small, capped, provider-supported cohort only. Compare loss rate and creator retention.

### Gate E — expand creators
Increase from 10–25 only when operations can explain every dollar, dispute and payout.

## Kill/pause criteria

Pause new transactions if:

- provider/acquirer requests it;
- compliance requirement is unmet;
- unexplained reconciliation breaks accumulate;
- chargeback/fraud metrics approach provider limits;
- account takeover/payout theft occurs without containment;
- prohibited-use incident reveals a systemic gap;
- reserve/settlement behavior threatens liquidity.

## Native apps

Not a beta dependency. Re-evaluate only after the web product proves demand and exact store-policy scope is reviewed.
