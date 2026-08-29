# 12 — Standards & Current-Version Reference Note

**Currentness checked:** 2026-08-29 against primary/official sources.

This note explains the baseline used to create the bundle. It does not replace a pre-install security/currentness check. The exact lockfile, build manifest, standards register and selected-provider documentation are authoritative for an implementation.

- **Next.js:** use 16.3.3 or a newer compatible patched 16.x release. The official August 2026 security release fixed critical issues; do not pin an older vulnerable patch.
- **Node.js:** use an Active or Maintenance LTS release for production. Node 24 is LTS on this date; Node 26 is Current.
- **PostgreSQL:** PostgreSQL 18.6 is the current stable 18 patch on this date; PostgreSQL 19 is prerelease and is prohibited for the V1 production manifest.
- **OWASP ASVS:** version 5.0.0 is the stable application verification baseline.
- **OWASP API Security Top 10:** use the 2023 edition for object/property/function authorization, resource consumption and sensitive business-flow threats.
- **OWASP Top 10:** use the 2025 edition as a current awareness baseline, supplemented by ASVS tests.
- **PCI DSS:** version 4.0.1 remains applicable. SAQ A reporting changes do not eliminate the underlying e-commerce payment-page/script security responsibilities.
- **WebAuthn:** use a maintained, security-reviewed implementation and current broadly deployed browser behavior; Level 3 is not treated as a reason to hand-roll cryptography/protocol verification.
- **NIST digital identity:** SP 800-63-4 is the current final family for identity, authentication and recovery principles.
- **NIST SSDF:** SP 800-218 version 1.1 is the final secure-development baseline. Draft 1.2 material is not silently promoted to a mandatory standard.
- **NIST incident response:** SP 800-61 Revision 3 is the current final incident-response baseline.
- **WCAG:** WCAG 2.2 Level AA is the accessibility target.
- **SLSA:** version 1.1 concepts guide provenance/supply-chain integrity where proportionate.
- **OpenTelemetry JavaScript:** traces and metrics are used as stable signals; experimental logging APIs are not the only durable log path.
- **Grok Build:** this bundle intentionally uses repository `AGENTS.md`, `.grok/skills/`, specialized subagents and `/goal`. Grok Build discovers repository skills and AGENTS instructions, while `/goal` is intended for long-running autonomous execution through completion/verification.

Recheck dependency security notices immediately before installation and every release. Any material version change must update `docs/standards-register.md`, the lockfile, relevant ADR, test evidence and this note in the next bundle revision.
