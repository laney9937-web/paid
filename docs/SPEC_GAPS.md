# Specification Gaps, Assumptions and External Blocks

## SPEC_GAP

| ID | Ambiguity/conflict | Why unsafe to infer | Affected requirements | Safe work that can continue | Decision owner | Status |
|---|---|---|---|---|---|---|
| GAP-001 | Exact live processor webhook header names | Public research is not a contract | PAY-004, LIVE-009 | Mock HMAC headers + canonical envelope | Provider ADR | OPEN |
| GAP-002 | Exact adult-lane wallet approval | Apple Pay/Google Pay unapproved | PROD exclusions, LIVE-004 | Ordinary mock hosted redirect only | Counsel/provider | OPEN |

## ASSUMPTION

See `docs/ASSUMPTIONS.md`.

## BLOCKED_EXTERNAL

| ID | External evidence required | Provider/counsel/owner | Affected live capability | Provider-independent implementation completed | Status |
|---|---|---|---|---|---|
| LIVE-001 | Processor adult platform approval | Processor | Live money | Yes (mocks) | BLOCKED_EXTERNAL |
| LIVE-002 | Merchant/funds-flow contract | Processor/counsel | Live money | Yes | BLOCKED_EXTERNAL |
| LIVE-003 | Launch-state payments analysis | Counsel | Live jurisdictions | Yes (allowlist engine) | BLOCKED_EXTERNAL |
| LIVE-004 | Adult/age/identity allocation | Provider/counsel | Adult lane live | Yes (typed states) | BLOCKED_EXTERNAL |
| LIVE-005 | Fees/reserves/payout rails | Provider | Live fees/payout | Yes (versioned mock) | BLOCKED_EXTERNAL |
| LIVE-006 | Vendor AUPs | Vendors | Hosting/email/KYC | Yes (mocks) | BLOCKED_EXTERNAL |
| LIVE-007 | Legal policies | Counsel | Live terms | Yes (versioned acceptances) | BLOCKED_EXTERNAL |
| LIVE-008 | PCI SAQ/checkout validation | Assessor | Live checkout | Yes (no PAN/CVV) | BLOCKED_EXTERNAL |
| LIVE-009 | Sandbox credentials | Provider | Sandbox adapter | Interface only | BLOCKED_EXTERNAL |
| LIVE-010 | Independent pentest | Security firm | Live money | Internal tests | BLOCKED_EXTERNAL |
| LIVE-011 | Ops staffing | Operator | Live ops | Runbooks | BLOCKED_EXTERNAL |
| LIVE-012 | Human go-live | Operator | Live money | No | BLOCKED_EXTERNAL |
| LIVE-013 | Tax/unclaimed funds | Tax counsel | Live tax | Typed UNKNOWN fail-closed | BLOCKED_EXTERNAL |
| LIVE-014 | Sanctions/AML allocation | Counsel/provider | Live AML | Typed states | BLOCKED_EXTERNAL |
| LIVE-015 | 2257/child-safety/IP | Counsel | Live T&S reporting | Case taxonomy | BLOCKED_EXTERNAL |
| LIVE-016 | Descriptor/disclosures | Provider | Live descriptor | Synthetic mock | BLOCKED_EXTERNAL |
| LIVE-BRAND-001 | App Store name reservation | Brand | Native metadata | Working name Paid | BLOCKED_EXTERNAL |
| LIVE-BRAND-002 | Trademark clearance | Counsel | Marketing | Working name Paid | BLOCKED_EXTERNAL |
| LIVE-BRAND-003 | Production domain | Operator | Production | paid.example in copy | BLOCKED_EXTERNAL |
| LIVE-BRAND-004 | Play conflict review | Operator | Native | Out of scope V1 | BLOCKED_EXTERNAL |
| LIVE-BRAND-005 | Descriptor/brand alignment | Provider | Live descriptor | Mock | BLOCKED_EXTERNAL |
