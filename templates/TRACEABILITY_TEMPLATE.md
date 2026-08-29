# Requirements Traceability

Use one row per atomic requirement. Never mark `VERIFIED` without evidence.

| Requirement ID | Source section | Requirement | Implementation files | Automated test IDs | Manual evidence | Environment | Status | Blocker/owner | Notes |
|---|---|---|---|---|---|---|---|---|---|

## Status definitions

- `VERIFIED`
- `IMPLEMENTED_BUT_UNVERIFIED`
- `PARTIALLY_VERIFIED`
- `FAILED`
- `BLOCKED_EXTERNAL`
- `NOT_APPLICABLE` with rationale

## Coverage checks

- Every non-LIVE release item has at least one traceability row.
- Every security/privacy/financial requirement has a negative or failure test.
- Every manual gate has a named evidence path and reviewer.
- No implementation file is cited as proof without a test or manual observation.
