# Authorization Matrix

Default is deny. UI visibility is never authorization.

| Command/query | Public | Guest buyer | Registered buyer | Owning creator | Other creator | Support | Disputes | Risk | Compliance | Payments/Reconciliation | Security admin | Worker/provider | Object/field scope | Fresh auth? | Audit? | Negative test ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Required attacker tests

- change creator/transaction/case IDs;
- paginate/search/export across tenant boundary;
- access with public order code only;
- use guest credential for another transaction;
- call staff function from lower staff role;
- request hidden fields via query/body/mass assignment;
- replay stale elevated session;
- use suspended/restricted account;
- bypass jurisdiction/compliance/feature gate;
- exploit cached response from another actor.
