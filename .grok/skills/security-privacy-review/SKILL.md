---
name: security-privacy-review
description: Adversarial security and privacy review for auth, APIs, ops, guest links, identity, sensitive data and browser behavior.
when-to-use: auth session passkey guest token privacy KYC ops API security release
paths:
  - "apps/web/**"
  - "apps/ops/**"
  - "packages/auth/**"
  - "packages/authorization/**"
  - "packages/compliance/**"
  - "packages/contracts/**"
  - "packages/config/**"
---

Read the Bible headings **Actors, tenancy, and authorization**, **Privacy engineering and data governance**, **Authentication, session, and recovery**, **Web and API security**, **Checkout and PCI boundary**, **Public links, domain security, and anti-phishing**, and **PWA, browser, and cache behavior**. Map applicable controls to OWASP ASVS 5.0, API Security and WSTG tests.

Review object, property and function authorization; session/cookie/CSRF; account recovery; secret-link leakage; CSP/caching/service worker; XSS/SSRF; rate limits; ops separation; logs/analytics; encryption/retention.

Test with attacker roles:

- another creator;
- unauthenticated guest with only public order code;
- guest with a token for another transaction;
- compromised creator session;
- malicious reviewer;
- card-testing bot;
- overprivileged support agent;
- attacker controlling an email inbox after account recovery.

Return findings by severity with exact reproduction, root cause and required regression protection. Do not approve based only on static code reading.
