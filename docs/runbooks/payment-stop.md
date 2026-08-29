# Runbook — Payment stop

**Owner:** Payments/Reconciliation  
**Severity default:** SEV-1  
**Paging/notification route:** ops on-call  
**Last tested:** 2026-08-29 mock

## Detection

Checkout error spike, provider unknown rate, reconciliation breaks.

## Immediate containment

Set kill switch `checkout_enabled=false`. Do not capture from browser returns. Do not retry unknown payments; reconcile.

## Triage

Use redacted logs, outbox age, provider inbox duplicates. Do not query PAN (none stored).

## Decision tree

Unknown payment → RECONCILIATION_HOLD. Confirmed failure → release only after provider proof. Confirmed capture → apply once.

## Recovery

Re-enable checkout after provider health and recon clear. Replay dead-letter jobs with audit.

## Communication

Internal ops, provider, affected users without leaking other buyers.

## Evidence preservation

Inbox, ledger, audit, legal hold if needed.

## Exit criteria

Error rate baseline, no unexplained breaks, kill switch owner sign-off.

## Follow-up

Sibling search for redirect-as-truth and duplicate webhooks. Add regression.
