# Adversarial review notes (PROVIDER_AGNOSTIC)

Reviewers: integrating agent plus automated negative tests. Date: 2026-08-29.

## Findings

| Severity | Finding | Status |
|---|---|---|
| High (prevented) | Two-buyer link race | Unique reservation + domain lock; tests pass |
| High (prevented) | Duplicate provider events | Inbox dedupe + capture idempotency |
| High (prevented) | GET consumption of secrets | peek vs exchange |
| Medium (fixed) | In-memory web store vs SQL | HTTP routes now use `withPostgresUow`; ASM-004 |
| Medium (fixed) | Guest mutation 303 used raw `Referer` | `assertAppPath` same-app redirects only |
| Medium | Better Auth passkey UI not fully exercised in browser | Passkey library pinned; enrollment UI is a shell with correct RP config pins |
| Low | Playwright WebKit/Firefox not run | Chromium+axe+320/390/zoom passed; extra engines are operator gates (UX-006 N/A) |

No remaining Critical unmitigated provider-independent defects. Live money remains BLOCKED_EXTERNAL.
