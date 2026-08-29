# 01 — Paid V1 Product & UX Specification

## 1. Product definition

**Paid** is a **trust-first transaction layer for people who buy from pseudonymous creators online**.

The user should never feel that they are opening a bank, marketplace, social network, or adult-content site. The customer-facing product should feel like a very small utility whose job is to answer four questions:

1. Is this creator a real verified adult?
2. Does this creator have a history of completing real transactions?
3. What am I paying and what was promised?
4. What happens if the transaction goes wrong?

The platform is not a discovery marketplace in V1. The relationship begins elsewhere (Reddit, Discord, X, Telegram, a creator's site, etc.). We provide the **trust URL + protected transaction**.

---

## 2. Primary nouns

### Creator
A privately verified seller who operates publicly using a pseudonym.

### Buyer
A person purchasing through a transaction link. Account creation is optional. Public identity is not required.

### Trust Profile
Public, privacy-preserving evidence derived from legitimate completed transactions and private verification.

### Transaction Link
A high-entropy canonical URL representing one creator + one intended transaction.

### Protected Transaction
A purchase with structured terms, a delivery deadline, status tracking, an internal resolution path, and eligibility for a verified review.

### Trust Tier
A public positive reputation classification. It is never purchasable.

### Payout Risk Tier
A private financial-risk classification. It is separate from public Trust Tier.

---

## 3. Product principles

### Safety
- Only transaction-linked buyers can review.
- Public trust data must be evidence-based.
- A creator cannot buy a badge.
- New creators receive conservative limits and payout timing.
- Payout destination changes lower payout confidence temporarily.
- Buyer protection promises must be objective and bounded.

### Privacy
- Creator legal identity is private.
- Buyer is anonymous to creator by default.
- Cardholder data remains with the processor wherever practical.
- KYC raw documents remain with the KYC/provider wherever practical.
- Adult transaction descriptions must be sufficient for compliance/disputes but deliberately non-graphic.
- Private transaction URLs must not be indexed or generate explicit social previews.

### Speed
- Guest buyer never has to register before paying unless a legal/provider requirement makes it mandatory.
- Creator can create a transaction link in seconds.
- Returning buyers may get faster checkout through provider-tokenized methods.
- Creator payout speed improves only when actual payment risk supports it.

### Trust
- Reviews arise from eligible economic transactions.
- Public trust emphasizes positive verified facts and statistically defensible metrics.
- Internal fraud grades are never exposed as defamatory public labels.

---

## 4. Exact V1 creator navigation

Bottom/primary navigation contains only:

1. **Home**
2. **Transactions**
3. **Create** (primary action)
4. **Trust**
5. **Account**

`Payouts` may be a Home detail rather than a sixth global navigation item if usability testing confirms this is simpler.

### 4.1 Home

The first viewport should contain:

- payout-eligible amount;
- pending amount;
- next payout/status;
- primary `Create link` action;
- compact trust summary;
- up to three recent transactions.

Example:

```
Available
$842.60

Pending $391.20       Next payout Tue

[ Create link ]

HIGH TRUST
4.96 ★ · 184 completed

Recent
A82F   $50   Awaiting delivery
P91K   $75   Completed
```

No charts in the initial viewport. No giant fintech cards. No decorative gradients. No fake net-worth UI.

### 4.2 Create Link

Required fields should be aggressively minimized while still supporting disputes/compliance.

1. Amount
2. Transaction category
3. Delivery deadline
4. Optional delivery alias/channel/reference
5. Optional concise non-explicit order note if provider/compliance permits

Possible category taxonomy:

- Digital commission
- Custom digital content
- Pre-made digital content
- Digital service
- Other permitted digital purchase

For age-restricted creators/transactions, classification is internal and cannot be hidden using a euphemistic category.

CTA: **Create link**

Confirmation:

```
Ready to share
$50 · delivery within 48 hours

paid.example/maya/4J7... 
[ Copy link ]
```

Do not require creating a catalog/product listing.

### 4.3 Transactions

Default is a simple chronological list with status:

- Awaiting delivery
- Delivered — awaiting buyer
- Completed
- Dispute open
- Refund/partial resolution
- Payment failed

Search by public order ID, buyer alias, amount, or date.

Avoid exposing payment-sensitive data in search results.

### 4.4 Transaction detail — creator

Show:

- public order ID;
- amount;
- platform-defined terms;
- deadline;
- buyer display (`Anonymous Buyer` or buyer-selected alias);
- payment state;
- fulfillment state;
- payout state;
- action to mark delivered;
- dispute state if applicable;
- activity timeline.

Never show buyer legal name/card/billing data unless an explicitly justified support/compliance workflow requires it.

### 4.5 Trust

Public-facing data and creator coaching are separate.

Public preview:

```
Maya ✓
HIGH TRUST
4.96 ★
184 completed transactions
Member since Aug 2026
```

Creator-only progression can show:

- successful transaction history;
- number of unique buyers;
- review eligibility/coverage;
- next trust milestone;
- payout eligibility status.

Never promise that `X reviews = instant payouts`. Wording should be:

> Faster payouts become available as your transaction history, account security, payment risk, and dispute history qualify.

### 4.6 Account

Contains:

- public pseudonym;
- verification status;
- security/passkey/MFA;
- payout destination status;
- privacy controls;
- support;
- legal policies;
- account deletion/closure;
- session/device management.

Payout destination change must require step-up authentication and trigger a payout-security cooling state.

---

## 5. Public creator trust page

Canonical route: `/@maya` or `/c/maya`.

The trust page is valuable even before a buyer has a specific transaction link.

First viewport:

```
Maya ✓
HIGH TRUST
4.96 ★
184 completed transactions
Identity privately verified
18+ verified (only where appropriate)
Member since Aug 2026

[ Pay Maya ]  // only if general link creation is allowed by provider/product policy
```

Do not publicly show:

- legal identity;
- exact dispute rate at tiny sample sizes;
- internal risk score;
- payout limitations;
- bank information;
- buyer identities;
- transaction details.

### Statistical rules

- Do not display an aggregate star rating until >= 10 eligible reviews.
- Do not display success/on-time percentages until >= 20 unique completed buyers.
- Use a Bayesian prior/confidence-aware score internally so 10/10 does not outrank 990/1000 solely by raw mean.
- Trust tier requires minimum tenure, unique buyers, eligible volume, and clean integrity signals.

---

## 6. Buyer checkout

The buyer path must work in mobile Safari/Chrome without installation.

### Screen 1 — Transaction page

First viewport:

```
Maya ✓          HIGH TRUST
4.96 ★ · 184 completed

$50.00
Protected digital purchase
Delivery within 48 hours

Protected if the agreed deliverable is not provided under the protection policy.

[ Continue to pay ]
```

Secondary details expand below:

- what protection covers;
- what it does not cover;
- privacy statement;
- transaction terms;
- creator support/report link;
- provider-approved statement descriptor copy when available, so the buyer can recognize the charge without revealing unnecessary detail.

For adult transactions, do not render Apple Pay/Google Pay unless the exact wallet/provider configuration has been explicitly approved. Current research indicates they should not be relied upon for the adult lane.

### Screen 2 — Processor checkout

Prefer:

1. redirect/hosted checkout when required or most compliant; or
2. processor-controlled hosted fields/Segments-style checkout where approved.

Our server never receives raw PAN/CVV.

Buyer account creation is not required.

### Screen 3 — Confirmation

```
Paid ✓
Order A82F

Your identity is hidden from the creator.
We'll use the minimum information required to operate and protect this transaction.
Your statement will show: [provider-approved descriptor]

[ View transaction ]
```

If the final descriptor can vary, the receipt must use accurate qualified language rather than a false promise.

Optional post-transaction registration:

> Keep your protected purchases in one place.
> [ Create account ]

Do not gate the receipt/status page behind registration.

---

## 7. Buyer identity planes

The architecture must make these different concepts explicit.

### Payment identity
Processor/card/bank data. Not creator-visible. Ideally not platform-visible beyond tokenized/reference fields.

### Compliance identity
Age/KYC/sanctions data where required. Not public. Minimized.

### Delivery identity
Optional buyer-selected Reddit/Discord handle or relay identifier. Creator-visible only if buyer chooses/transaction requires it.

### Transaction identity
`Anonymous Buyer · Order A82F` — creator-visible.

### Fraud identity
Device, IP, provider risk/fingerprint references. Restricted to risk/compliance staff/services.

### Support identity
Receipt address and verification context. Restricted.

---

## 8. Guest transaction access

Public order ID and authentication credential must never be the same.

- `A82F` = safe public/support reference.
- `transaction_access_token` = 128+ bits effective entropy, private credential.

Rules:

- secret token never enters analytics payloads;
- secret token excluded from referrer leakage;
- URLs use restrictive `Referrer-Policy`;
- pages are `noindex,nofollow`;
- social metadata never includes sensitive transaction detail;
- risky actions can require emailed step-up verification;
- secret can be revoked/reissued.

---

## 9. Fulfillment

V1 does not host the purchased file/content.

Creator selects `Mark delivered` and provides only approved metadata/reference required by the product/provider, not routine explicit media.

Fulfillment record contains:

- delivered timestamp;
- delivery method/category;
- optional external reference metadata;
- creator declaration;
- immutable audit event.

Buyer receives a privacy-safe update and can:

- Confirm received
- Report a problem

Auto-completion after a defined window is possible only after provider/legal/product review.

---

## 10. Buyer protection

Never use an absolute `100% protected` claim.

### Candidate covered events

- no delivery by agreed deadline;
- materially different deliverable as measured against structured terms;
- duplicate/erroneous platform processing;
- other explicitly documented policy outcomes.

### Candidate non-covered events

- buyer remorse after receiving a non-returnable digital deliverable;
- subjective dissatisfaction where agreed objective terms were met;
- collusive/prohibited transactions;
- claim outside applicable reporting window.

Final policy language is provider/counsel dependent.

---

## 11. Dispute UX

From buyer transaction page:

```
Need help?
[ I didn't receive it ]
[ It wasn't what was agreed ]
[ Something else ]
```

Flow:

1. Buyer chooses reason.
2. Platform shows relevant objective terms/timeline.
3. Creator gets short response period.
4. Straightforward non-delivery can be resolved according to policy.
5. Ambiguous cases enter human review during beta.
6. Illegal/underage/non-consensual reports bypass commercial dispute flow into Trust & Safety escalation.

Evidence defaults to metadata. Explicit media is not routine evidence.

---

## 12. Reviews

Eligibility:

- one eligible transaction -> maximum one creator review;
- failed/stolen/self-transaction can be ineligible;
- review policy handles refunds/disputes explicitly;
- buyer can remain publicly `Verified Buyer`.

Review form:

- Overall: 1–5
- Delivered as agreed? Yes/No
- Delivered on time? Yes/No/Not applicable
- Optional short text

Abuse controls:

- repeated buyer/creator pair weighting;
- payment/device/link graph;
- self-purchase detection;
- suspicious low-ticket review farms;
- delayed publication where useful;
- no creator-controlled deletion of legitimate negative reviews.

---

## 13. Trust versus Risk

### Public Trust Engine
Inputs: verified identity, tenure, unique successful buyers, eligible completed transactions, verified reviews, objective fulfillment history.

Outputs: positive trust tier and defensible public statistics.

### Private Risk Engine
Inputs additionally include processor fraud results, chargebacks, amount/velocity changes, payout method changes, device/IP anomalies, buyer concentration, linked accounts, account recovery, reserve coverage and provider constraints.

Outputs:

- transaction limits;
- outstanding exposure limits;
- payout delay;
- payout cap;
- manual review;
- reserve recommendation;
- eligibility for accelerated payout.

A high public Trust Tier never guarantees an unrestricted payout.

---

## 14. Payout UX

Creator sees ledger-derived categories, not one ambiguous balance:

- Gross transaction amount
- Processor/platform deductions
- Reserved amount
- Payout-eligible amount
- Scheduled/in-transit payout
- Negative adjustments if legally/contractually applicable

Use clear explanations.

V1: no startup-financed instant payout.

Future: accelerated/instant payout only through provider-approved rails and exposure controls.

---

## 15. Fees

No subscriptions.

Preferred V1:

### Creator-side take rate
Creator sets $50. Buyer sees and authorizes exactly $50. Processor/platform economics are deducted from creator proceeds.

If creator wants a target net amount later, an `all-in price` calculator may compute the customer-facing total before the link is published. The buyer must see one final price from the first material price presentation.

No surprise checkout junk fees.

---

## 16. Adult/non-adult segmentation

This must be a real compliance/payment distinction, not only a UI boolean.

The selected provider may require separate merchant portfolios/MIDs/configuration. The domain can share product identity while payment capabilities differ.

Adult lane:

- processor-approved card/debit/alternative methods;
- adult creator compliance;
- provider/card-network requirements;
- no wallet method merely because gateway SDK technically supports it.

Ordinary creator lane:

- wallets may be possible only under separately approved configuration.

---

## 17. Accessibility

Every core flow must support:

- semantic HTML;
- keyboard operation;
- screen readers;
- visible focus;
- minimum touch targets;
- zoom/text scaling;
- contrast;
- motion reduction;
- non-color status indicators;
- descriptive errors.

---

## 18. Anti-vibe-coded UX rules

The product should be quiet, fast and intentional.

### Required
- one spacing scale;
- one typography scale;
- limited radius system;
- consistent button heights;
- native/system fonts unless branding later justifies otherwise;
- deterministic page transition behavior;
- skeleton dimensions matching loaded content;
- no layout shift after hydration;
- immediate button pressed state;
- idempotent submissions;
- consistent errors;
- predictable back navigation.

### Avoid
- gradients as decoration;
- giant rounded cards around every element;
- glassmorphism;
- random icon styles;
- excessive shadows;
- fake dashboards;
- gratuitous animation;
- carousels;
- full-screen onboarding tutorials for obvious actions;
- five confirmation dialogs to accomplish one transaction.

---

## 19. V1 success metrics

Primary north star: **Successfully Completed Protected GMV**.

Supporting:

- link open -> checkout start;
- checkout start -> authorization success;
- authorization -> successful protected completion;
- disputes per completed transaction;
- chargebacks per transaction;
- creator repeat usage;
- buyer repeat usage;
- median create-link time;
- median checkout time;
- support contacts per 100 transactions;
- fraud loss/GMV;
- review participation;
- payout failure rate;
- reconciliation breaks.

Raw GMV alone is not a success metric.
