# Data Classification & Retention Register

| Field/data set | Subject | Class | Purpose | Collector/source | Processor/storage | Public | Creator-visible | Staff roles | Encryption/tokenization | Retention trigger/period | Deletion/anonymization | Exportable | Legal hold | Logged/analytics? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Classes

- `PUBLIC`
- `INTERNAL`
- `CONFIDENTIAL`
- `RESTRICTED_IDENTITY`
- `RESTRICTED_PAYMENT`
- `RESTRICTED_ADULT_LINKAGE`
- `SECURITY_SECRET`

## Mandatory review questions

- Can the platform avoid receiving this data?
- Can the provider retain it instead?
- Can an eligibility/token result replace raw evidence?
- Does any DTO, log, trace, error, analytics event, export or cache expose it?
- Is retention based on law/contract/documented necessity rather than convenience?
- Is deletion compatible with ledger/audit/chargeback/legal-hold duties?
