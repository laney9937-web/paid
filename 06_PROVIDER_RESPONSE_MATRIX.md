# 06 — Provider Response Matrix

Fill this directly from written provider replies. Do not fill unknowns from sales assumptions.

| Question | Segpay | CCBill | Verotel/Yoursafe | Decision impact |
|---|---|---|---|---|
| Exact lawful adult creator-platform approval | Pending | Pending | Pending | Hard gate |
| Third-party creators/submerchants supported | Pending | Pending | Pending | Hard gate |
| Merchant/seller hierarchy | Pending | Pending | Pending | Legal/funds flow |
| External content delivery permitted | Pending | Pending | Pending | Hard gate |
| Platform adult compliance duties | Pending | Pending | Pending | Ops burden |
| Creator public pseudonym permitted | Pending | Pending | Pending | Product principle |
| Creator KYC/age handled by provider | Pending | Pending | Pending | Data/privacy |
| Buyer age method required | Pending | Pending | Pending | Checkout friction |
| Hosted/embedded PCI-minimized checkout | Publicly promising | Publicly promising | Publicly promising | Conversion/security |
| One-time dynamic payment links | Yes/publicly supported | Yes/publicly supported | Yes/FlexPay | Core functionality |
| Third-party creator payout | Publicly supported; approval needed | Needs exact confirmation | Platform Connect supports talent payouts | Major criterion |
| Risk-based payout hold/release | Pending | Pending | Pending | Faster payout design |
| Instant/accelerated payout rail | Pending | Pending | Talent accounts offer fast availability; exact US fit pending | Retention |
| Reserve % / duration | Public FAQ says 5%/6mo generally; exact quote pending | Pending | Public Basic: 10%/6mo | Economics |
| Processing rate | Pending quote | Pending quote | Public Basic 15.5%; Premium variable | Economics |
| Chargeback/refund fees | Pending | Pending | Public model differs; confirm | Economics |
| Transaction max | Pending | Pending | Pending | Product/AOV |
| Creator countries | Pending | Pending | Worldwide claims; exact restrictions pending | Market |
| US state restrictions | Pending | Pending | Pending | Launch geography |
| Statement descriptor | Pending | Pending | Pending | Privacy/chargebacks |
| Termination reserve/settlement | Pending | Pending | Pending | Existential continuity |
| Sandbox/test environment | Pending | Docs indicate integration support | Docs/API available | Engineering |
| Webhook signatures/idempotency | Confirm exact mechanism | Confirm exact mechanism | Confirm exact mechanism | Financial integrity |

## Selection decision record

Once replies arrive, create `ADR-001-payment-provider.md` containing:

1. chosen provider;
2. rejected alternatives and why;
3. merchant/funds-flow diagram;
4. creator onboarding flow;
5. supported payment methods by adult/non-adult lane;
6. payout/reserve model;
7. provider status -> canonical state mapping;
8. compliance duties owned by provider vs platform;
9. pricing assumptions replaced by actual signed terms;
10. business continuity/fallback plan.
