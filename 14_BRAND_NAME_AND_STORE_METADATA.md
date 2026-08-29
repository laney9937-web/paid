# 14 — Paid Brand Name, Store Metadata & Clearance Gate

## Decision

The working public product name is:

# **Paid**

Use **Paid** in the product wordmark, PWA name, prototype, customer-facing copy, repository title, and on-device display name.

This is a **working brand decision**, not a representation that the name has been legally cleared, federally registrable, available in every app-store locale, or available as a matching domain/handle.

## Brand promise

The name should communicate the result without turning the product into a noisy fintech brand.

Recommended brand sentence:

> **Paid makes online transactions safer when you do not know the person behind the username.**

Product pillars remain:

- Safety
- Privacy
- Speed
- Trust

The brand is `Paid`; the domain concepts remain `Trust Engine`, `Risk Engine`, `Protected Transaction`, and `Verified Buyer` because those names describe product behavior rather than the company name.

## App-store naming rule

### Preferred public App Store name

`Paid`

Attempt to create/reserve the exact name in App Store Connect before native-app implementation, marketing spend, final icon production, or launch announcements.

Public web search did not surface a current US listing whose complete displayed title is exactly the one word `Paid`, but it did surface multiple current listings beginning with it, including:

- `Paid - Expenses Tracker`
- `Paid - Debt Tracker`
- `Paid: Invoices & Estimates`

Therefore, public search is **not proof** that the exact App Store Connect name is reservable. App Store Connect is the operational source of truth for reservation, and App Review remains separate.

### Subtitle if exact name is accepted

Preferred initial subtitle:

`Protected creator payments`

This is within Apple's 30-character subtitle limit and explains the product without exposing an adult-specific beachhead in general-audience metadata.

Possible ASO variants must be tested and reviewed for accuracy rather than keyword stuffing:

- `Protected online payments`
- `Pay creators with confidence`
- `Verified creator payments`

### Fallback behavior if exact name cannot be reserved

Do not rename the in-product brand impulsively.

A fallback App Store metadata title may add a descriptive qualifier while the product wordmark and on-device display remain `Paid`, for example:

- `Paid — Protected Payments`
- `Paid — Creator Payments`

A fallback may be used only after App Store Connect rejection/conflict is documented in an ADR. It is not the preferred name.

## Google Play

The Android package identifier must be distinctive and permanent even if the store display name is `Paid`.

Do not assume Google Play uniqueness or trademark safety merely because a display title can be submitted. Confirm publisher-name and listing conflicts before launch.

## Legal and trademark gate

`Paid` is an ordinary word closely connected to the function of a payment product. That creates two risks:

1. it may be considered weak or merely descriptive for payment-related software/services; and
2. existing users of identical or similar names in related commerce/payment categories may create likelihood-of-confusion risk even when their exact app-store title differs.

Known adjacent public uses discovered during the preliminary pass include:

- `Paid.com`, an ecommerce and payment platform;
- `Paid.link`, a service for selling digital content through paid links;
- a Google Play publisher named `Paid, Inc.` describing an ecommerce/payment platform;
- multiple App Store applications using `Paid` as the dominant first word.

These findings do not decide infringement or registration, but they are sufficient to prohibit claiming the brand is cleared.

Before real launch, obtain a comprehensive US trademark/common-law/domain clearance focused at minimum on software and payment/marketplace services, including related classes and confusingly similar marks—not only exact-string matches.

## Domain rule

The production domain is deliberately **not locked** in this build package.

Do not use or imply ownership of `paid.com` or `paid.link`. Both are already used by adjacent commercial services.

Until clearance and acquisition are complete, examples must use the reserved documentation domain:

`paid.example`

Do not ship `.example` in production.

The final domain should be:

- short enough to dictate verbally;
- resistant to phishing/typosquatting;
- clearly controlled by the company;
- compatible with privacy-safe transaction links;
- not confusingly similar to an existing payment service;
- reviewed together with the trademark clearance.

## Legal entity and provider descriptor

The legal company name may differ from the public brand `Paid`.

The processor/acquirer controls or approves merchant descriptors. A buyer's statement descriptor must be discreet but recognizable and may not be assumed to equal `Paid` until provider approval is recorded.

## Product copy rules

Use:

- `Paid`
- `Paid link`
- `Paid protected transaction`
- `Pay securely with Paid`
- `Verified through Paid`

Avoid claims that imply a regulated status we do not have:

- `Paid wallet`
- `Paid escrow`
- `Paid bank`
- `Paid guarantees every purchase`
- `100% protected`

## Required external gates

The following do not block the provider-agnostic build, but they block brand launch and native store submission:

- `LIVE-BRAND-001` Exact `Paid` App Store name successfully reserved in App Store Connect or an ADR approves a qualified metadata fallback.
- `LIVE-BRAND-002` Comprehensive trademark/common-law clearance completed for the actual goods/services and launch geography.
- `LIVE-BRAND-003` Production domain acquired and cleared; phishing/typosquatting plan documented.
- `LIVE-BRAND-004` Google Play listing/publisher conflict review completed.
- `LIVE-BRAND-005` Provider-approved statement descriptor and customer-support identification are consistent with the final brand.
- `LIVE-BRAND-006` Final icon/wordmark clearance performed before high-cost creative production.

## Grok implementation instruction

Grok must use `Paid` consistently in customer-facing mock/prototype/build surfaces.

Grok must not:

- claim `Paid` is trademarked or legally cleared;
- hardcode a real production domain;
- use `paid.com` or `paid.link`;
- make brand clearance a provider-independent coding blocker;
- invent a fallback store title unless the exact reservation fails and an ADR records the decision.
