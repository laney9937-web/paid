# Data Classification & Retention Register

| Field/data set | Subject | Class | Purpose | Collector/source | Processor/storage | Public | Creator-visible | Staff roles | Encryption/tokenization | Retention trigger/period | Deletion/anonymization | Exportable | Legal hold | Logged/analytics? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Creator handle/display | creator | PUBLIC | trust page | user | Postgres | Y | Y | all | none | account life | handle reserved | Y | Y | Y public |
| Creator legal/KYC raw | creator | RESTRICTED_IDENTITY | eligibility | identity mock/provider | provider; we store status only | N | N | compliance | status only | provider policy | anonymize status | N | Y | N |
| Buyer email | buyer | RESTRICTED_IDENTITY | receipt | guest form/provider | digest + provider | N | N | support hashed | digest | tx+chargeback window | anonymize | limited | Y | N |
| Guest token | buyer | SECURITY_SECRET | access | generated | HMAC digest | N | N | none | HMAC-SHA-256 | short | delete digest | N | Y | N |
| PAN/CVV | buyer | RESTRICTED_PAYMENT | payment | never | never | N | N | none | n/a | n/a | n/a | N | n/a | N |
| Amount/fees snapshot | tx | CONFIDENTIAL | history | server | Postgres | N | own | payments | none | legal/financial | retain | Y | Y | Y redacted |
| Public order code | tx | PUBLIC | support ref | server | Postgres | Y | Y | all | none | legal | retain | Y | Y | Y |
| Risk features | creator | CONFIDENTIAL | payout | server | Postgres | N | N | risk | none | policy | retain decisions | N | Y | N |
| Adult lane flag | tx | RESTRICTED_ADULT_LINKAGE | routing | server | Postgres | N | own | compliance | none | legal | minimize | N | Y | N |
| Audit events | mixed | CONFIDENTIAL | accountability | server | Postgres append-only | N | N | security | none | legal | retain | limited | Y | N restricted |
