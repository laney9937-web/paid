# External Compliance Decision Register

This file records approved external conclusions and their technical consequences. It is not a substitute for counsel/provider evidence.

| Decision ID | Domain | Exact question | Current status | Authoritative owner/source | Jurisdiction/portfolio | Effective/review date | Product/config impact | Data/retention impact | Ops/runbook impact | Linked ADR/LIVE gate | Evidence path |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ECD-PAY | money-transmission/funds flow | Who is merchant of record? | BLOCKED_EXTERNAL | provider/counsel | US | pending | live checkout fail-closed | retain snapshots | payment-stop | LIVE-001/002 | docs/SPEC_GAPS.md |
| ECD-TAX | tax/PSE/unclaimed | Who remits tax and unclaimed funds? | BLOCKED_EXTERNAL | tax counsel | US | pending | PLATFORM_MOCK_ZERO_TAX | no invented tax PII | payout aging | LIVE-013 | docs/SPEC_GAPS.md |
| ECD-AML | sanctions/AML | Who screens and files? | BLOCKED_EXTERNAL | provider/counsel | US | pending | typed UNKNOWN fail-closed | status only | sanctions case | LIVE-014 | docs/SPEC_GAPS.md |
| ECD-ADULT | adult/card-network/2257 | Who holds 2257 and age? | BLOCKED_EXTERNAL | counsel | US | pending | adult lane disabled live | no media | T&S cases | LIVE-004/015 | docs/SPEC_GAPS.md |
| ECD-CHILD | child-safety reporting | CyberTipline process? | BLOCKED_EXTERNAL | counsel | US | pending | case taxonomy only | evidence hold | T&S | LIVE-015 | docs/SPEC_GAPS.md |
| ECD-IP | IP/DMCA | Repeat infringer process? | BLOCKED_EXTERNAL | counsel | US | pending | report routing | holds | T&S | LIVE-015 | docs/SPEC_GAPS.md |
| ECD-PRIV | privacy/biometric | Age-assurance data location? | BLOCKED_EXTERNAL | counsel | US | pending | status only | minimize | privacy runbook | LIVE-007 | docs/SPEC_GAPS.md |
| ECD-DESC | descriptor/disclosures | Approved descriptor copy? | BLOCKED_EXTERNAL | provider | mock portfolio | pending | TRUST*CREATOR synthetic | snapshot | support | LIVE-016 | docs/SPEC_GAPS.md |
