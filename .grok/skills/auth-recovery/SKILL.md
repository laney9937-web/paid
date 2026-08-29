---
name: auth-recovery
description: Apply whenever changing creator/staff authentication, passkeys, sessions, email change, guest links, recovery or high-risk step-up.
when-to-use: authentication login passkey magic link recovery session cookie step-up email change guest access
paths:
  - "packages/auth/**"
  - "packages/authorization/**"
  - "apps/web/**/sign-in/**"
  - "apps/web/**/security/**"
  - "apps/ops/**"
---

Read the Bible headings **Privacy engineering and data governance**, **Authentication, session, and recovery**, **Web and API security**, and **Public links, domain security, and anti-phishing**.

Model attacker-controlled email, stolen session, credential stuffing, enumeration, passkey deletion, lost-device recovery and mature-creator payout takeover.

Mandatory properties:

- magic-link/recovery tokens are high entropy, hashed at rest, atomic single use and expiring;
- passkey origin, RP ID, challenge, signature and user verification are validated by a maintained library;
- sessions rotate after authentication, recovery and privilege elevation;
- recovery/email/security changes trigger alerts and payout-security cooldown where applicable;
- public order code is never a credential;
- guest secret is exchanged into a clean secure cookie and removed from URL;
- ops auth is isolated and stronger than customer auth.

Run negative authorization and concurrent replay/revocation tests. Never treat possession of an order number or profile knowledge as identity proof.
