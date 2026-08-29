# 02 — Payment Infrastructure Provider Scorecard

## Decision objective

Choose the provider that removes the maximum regulated/payment complexity while preserving our differentiating product: pseudonymous trust, anonymous-to-creator checkout, protected transactions, transaction-authenticated reviews and risk-controlled creator payouts.

Scores below are **provisional public-evidence scores**, not underwriting approval.

## Weighted criteria

| Criterion | Weight |
|---|---:|
| Lawful adult category support | 15 |
| Creator/fan-platform fit | 12 |
| PayFac/submerchant architecture | 12 |
| Third-party creator payouts | 12 |
| Checkout/API + PCI minimization | 10 |
| Fraud/3DS/chargeback infrastructure | 8 |
| Ability to support payout holds/risk progression | 8 |
| US launch fit | 6 |
| Public commercial clarity | 5 |
| Business continuity / provider maturity | 5 |
| Privacy/pseudonym compatibility | 4 |
| Integration/documentation quality | 3 |
| **Total** | **100** |

## Provisional ranking

### 1. Segpay — **best current fit**

Publicly verified strengths:

- Registered Visa/Mastercard Payment Facilitator in US, UK and EU.
- Handles submerchant onboarding.
- One-time, subscription and one-click billing.
- Hosted/customizable checkout.
- Segpay Segments is explicitly positioned for fan sites/content creators.
- Segments lets merchant keep its branded page while sensitive card data goes directly to Segpay, reducing PCI scope.
- Segments includes risk management, end-user support, reporting and third-party payouts.
- Public FAQ says Segpay can handle contractor/content-creator/affiliate payouts.
- Partner Payout exists but requires approval.
- 3DS support and risk tools.
- Public FAQ currently states 5% six-month rolling reserve for Segpay's general merchant setup; our exact terms remain underwriting-specific.

Critical unknowns:

- exact creator/submerchant hierarchy for this product;
- whether every creator must be separately underwritten/registered;
- external adult-delivery compliance allocation;
- whether Partner Payout/Segcard is approved for our exact model;
- whether payout holds/release logic can be driven from our risk state;
- actual rate/fees/limits;
- accepted states/countries and ticket limits.

**Provisional score: 90/100 pending underwriting.**

### 2. CCBill — **excellent processing/compliance fit; payout model needs confirmation**

Publicly verified strengths:

- Explicitly serves adult businesses and content-creator platforms.
- PSP merchant account is a submerchant under CCBill's master merchant account.
- CCBill states PCI compliance is managed at platform level.
- MCC classification, fraud monitoring, 3DS 2.0 and AVS included in PSP offering.
- One-time/recurring payment processing, gateway, webhook/API docs.
- No direct acquiring-bank relationship required under PSP model.
- Public PSP pricing model is flat-rate/no monthly fee, but the actual rate is underwriting-specific.

Critical unknowns:

- whether individual creators can be directly onboarded/payout beneath our platform;
- third-party creator payout rails and risk-based release controls;
- exact adult creator platform compliance responsibilities for external delivery;
- ticket/volume limits;
- actual rate, reserve and settlement terms.

**Provisional score: 82/100 pending underwriting.**

### 3. Verotel / Yoursafe — **strong fallback, particularly for automated talent payout**

Publicly verified strengths:

- Long-standing adult/high-risk IPSP/Payment Facilitator.
- FlexPay supports dynamic once-off purchases.
- Platform Connect supports mass payments, automated talent payouts, paired talent accounts and payout reporting.
- Talent must prove identity and consent to account pairing.
- Yoursafe Talent Accounts support IBAN/account infrastructure; payout methods publicly include SEPA, wire, US ACH, US check and internal transfers.
- Automated Talent Payout can determine percentage/fixed amount at transaction time.
- Adult is explicitly accepted.
- Public pricing is unusually transparent.

Commercial concern:

- Public Verotel Basic pricing currently advertises 15.5% per non-recurring card transaction plus a 10% six-month rolling reserve and EUR 500 annual registration, while Premium rates vary by volume/history. That could make low-ticket transactions difficult.

Critical unknowns:

- US corporate/platform structure for our exact model;
- whether each creator needs a Yoursafe account and UX consequences;
- exact protection/dispute integration;
- provider treatment of our public pseudonym/guest checkout model;
- current API ergonomics and modern webhook guarantees.

**Provisional score: 76/100; architecture is compelling, economics may be weaker.**

## Current selection rule

1. Choose **Segpay** if underwriting confirms our exact platform + creator payout architecture and commercial terms are viable.
2. Choose **CCBill** if Segpay cannot provide the required creator payout/control model or CCBill's commercial/underwriting terms materially outperform it.
3. Maintain **Verotel/Yoursafe** as a real contingency, especially if automated talent payouts and international talent accounts outweigh the higher public cost.
4. Never architect the business around one provider. Keep payment/provider domain boundaries portable.

## Hard pass/fail questions

A provider is disqualified from primary status if any answer is unacceptable:

- Will you approve lawful adult third-party digital creators and external fulfillment in writing?
- What is the exact seller/submerchant hierarchy?
- Can buyer card data stay completely out of our servers?
- Can creators remain publicly pseudonymous after private KYC/age verification?
- Can individual creators receive provider-controlled payouts?
- Can payout eligibility be held/limited according to risk/completion states?
- What adult/card-network compliance duties remain with us when we don't host the media?
- What states/countries and ticket sizes are approved?
- What are real processing, reserve, refund, chargeback and payout economics?
- What happens to reserves/settlement on termination?

## Provider adapter requirements

Regardless of provider, application code must depend on an internal interface rather than provider-specific semantics:

```ts
interface PaymentProviderAdapter {
  createCreatorOnboarding(input): Promise<OnboardingSession>;
  getCreatorComplianceStatus(providerCreatorId): Promise<ComplianceStatus>;
  createCheckout(input): Promise<CheckoutSession>;
  getPayment(providerPaymentId): Promise<ProviderPayment>;
  refund(input): Promise<RefundResult>;
  getDispute(providerDisputeId): Promise<ProviderDispute>;
  setPayoutRestriction?(input): Promise<void>;
  getPayoutStatus(providerPayoutId): Promise<ProviderPayout>;
  verifyWebhook(rawBody, headers): VerifiedProviderEvent;
  reconcile(start, end): Promise<ProviderLedgerBatch>;
}
```

Provider events are normalized into our canonical domain events before they touch product state.
