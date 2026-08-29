# Runbook — payout-hold

**Owner:** Ops  
**Severity default:** SEV-2  
**Paging/notification route:** ops on-call  
**Last tested:** 2026-08-29 mock

## Detection
Alerts and customer reports.

## Immediate containment
Use the relevant kill switch. Do not overwrite ledger balances.

## Triage
Redacted logs, audit events, reconciliation breaks.

## Decision tree
Fail closed on unknown required state.

## Recovery
Reconcile, replay audited jobs, confirm no double effects.

## Communication
Internal, provider, affected users as applicable.

## Evidence preservation
Audit/ledger/inbox plus legal hold if needed.

## Exit criteria
Service restored and unexplained breaks cleared.

## Follow-up
Sibling-defect search and regression test.
