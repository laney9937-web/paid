# Authorization Matrix

Default is deny. UI visibility is never authorization.

| Command/query | Public | Guest buyer | Registered buyer | Owning creator | Other creator | Support | Disputes | Risk | Compliance | Payments/Reconciliation | Security admin | Worker/provider | Object/field scope | Fresh auth? | Audit? | Negative test ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View /c handle | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | PublicCreatorDTO | N | N | AUTHZ-public |
| Create checkout | Y | Y | Y | N | N | N | N | N | N | N | N | N | link offer | N | Y | create-checkout.test |
| Guest receipt | N | scoped | N | N | N | N | N | N | N | N | N | N | one tx | N | Y | guest token tests |
| Mark delivered | N | N | N | Y | N | N | N | N | N | N | N | N | own tx | N | Y | fulfillment tests |
| Confirm/dispute/review | N | scoped | N | N | N | N | N | N | N | N | N | N | one tx | N | Y | review tests |
| Refund | N | N | N | N | N | N | Y | N | N | Y | N | N | payment | Y | Y | refund tests |
| Ledger adjust | N | N | N | N | N | N | N | N | N | Y | N | N | journal | Y dual | Y | ledger tests |
| Provider webhook | N | N | N | N | N | N | N | N | N | N | N | Y | inbox | signature | Y | simulator |
| Ops impersonation | N | N | N | N | N | N | N | N | N | N | break-glass only | N | session | Y | Y | AUTHZ-006 |
