# Provider Capability Matrix — mock

**ADR:** ADR-001  
**Contract/doc version:** last-mile v1  
**Sandbox account/portfolio:** mock-portfolio-usd-digital  
**Last verified:** 2026-08-29

| Capability | Required? | Provider support | Canonical method/event | Adult lane | Ordinary lane | Limits | Failure behavior | Reconciliation source | External approval/evidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Creator onboarding | Y | SUPPORTED | createCreatorOnboarding | UNSUPPORTED | SUPPORTED | mock | REJECTED scenario | n/a | LIVE-001 | MOCK |
| Identity/age status | Y | SUPPORTED | getStatus | mock | mock | n/a | UNKNOWN fail-closed | n/a | LIVE-004 | MOCK |
| One-time checkout | Y | SUPPORTED | createCheckout | UNSUPPORTED | SUPPORTED | ticket limits | decline/unknown | fetchReconciliation | LIVE-009 | MOCK |
| Refund/partial refund | Y | SUPPORTED | createRefund | n/a | SUPPORTED | remaining refundable | FAILED | recon | LIVE-005 | MOCK |
| Network disputes | Y | SUPPORTED | getNetworkDispute | n/a | SUPPORTED | n/a | coexist with internal | recon | LIVE-005 | MOCK |
| Payout | Y | SUPPORTED | getPayout | n/a | SUPPORTED | holds | retry, never revenue | recon | LIVE-005 | MOCK |
| Webhook signature/rotation | Y | SUPPORTED | verifyAndNormalizeWebhook | n/a | SUPPORTED | 5m timestamp | reject | inbox | LIVE-009 | MOCK |
| Statement descriptor | Y | SUPPORTED | snapshot | synthetic | TRUST*CREATOR | n/a | labeled synthetic | snapshot | LIVE-016 | MOCK |
| Tax/PSE | Y | UNKNOWN live | taxResponsibility | n/a | PLATFORM_MOCK_ZERO_TAX | n/a | fail-closed UNKNOWN | n/a | LIVE-013 | BLOCKED_EXTERNAL |
