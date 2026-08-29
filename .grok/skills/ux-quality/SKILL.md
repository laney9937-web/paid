---
name: ux-quality
description: Review customer-facing UI for intentional, minimal, accessible, non-vibe-coded behavior under real browser and failure conditions.
when-to-use: UI UX design page component responsive loading error animation accessibility jank
paths:
  - "apps/web/**"
  - "packages/ui/**"
---

Read `01_V1_PRODUCT_UX_SPEC.md` and the Bible headings **Email and notification delivery**, **PWA, browser, and cache behavior**, **Product design and anti-vibe-coded UI**, **Accessibility**, and **Performance and capacity**.

Inspect actual behavior at 320px, 390px, wide mobile and desktop. Check loading geometry, hydration/theme flash, keyboard, focus, browser back/refresh, duplicate submission, scrolling, text scaling, reduced motion, screen-reader semantics, slow network, provider outage and stale state.

Reject unnecessary cards, gradients, glass, fake charts, random shadows, inconsistent radii/type/button heights, ornamental animation or verbose onboarding.

Every screen must make the next action, transaction state, privacy state and trust claim obvious. Add visual/interaction regression tests for each repaired issue.
