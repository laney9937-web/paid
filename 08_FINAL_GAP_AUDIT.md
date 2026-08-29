# 08 — Final Gap Audit

## Outcome

The original Bible had the correct high-level product boundaries, but it was not deterministic enough for a strong coding agent to build the entire provider-independent system without improvising important details. This pass converted the missing areas into explicit architecture, implementation, and verification requirements.

## Critical gaps closed

### Build determinism

- froze build modes and document precedence;
- froze a stable technical stack and repository shape;
- added a one-go completion loop so the agent cannot stop at scaffolding;
- defined reversible decisions versus true external blockers;
- added exact build outputs and final report format.

### Financial correctness

- added transaction snapshots for fees, policies, trust, provider, and jurisdiction;
- expanded payment, refund, dispute, payout, and review state machines;
- added concurrency control and database invariants;
- added transactional outbox/provider inbox;
- added partial refund, reserve release, chargeback reversal, negative balance, payout reversal, and manual adjustment scenarios;
- added reconciliation cutoffs, source hashes, break queues, and no-overwrite rules.

### Authentication and privacy

- selected passkey + hashed single-use magic-link architecture;
- added session/device lifecycle and strong account recovery;
- added high-risk action step-up and payout cooldown after identity/email/destination changes;
- added hashed guest bearer tokens and immediate clean-URL exchange;
- added data classification, retention, legal hold, export/closure, encryption/key rotation, and sensitive adult-interest linkage controls;
- banned session replay and sensitive analytics on critical pages.

### Compliance and abuse

- added versioned jurisdiction/compliance decision engine;
- added real adult/non-adult merchant-lane separation;
- added agreement/policy acceptance versioning;
- added prohibited-use/T&S cases and emergency link/payout controls;
- froze no media/file uploads and no arbitrary external URL fetches;
- added KYC/age/provider adapter boundaries without inventing legal outcomes.

### Web/PCI/security

- added explicit CSP/HSTS/referrer/permissions/cache controls;
- added Next.js private-cache leakage prevention;
- added checkout script inventory/tamper/change controls for PCI scope;
- added anti-phishing/domain/email-authentication requirements;
- added API inventory, OpenAPI contracts, body limits, mass-assignment defense, Unicode/handle impersonation controls, and layered abuse limits;
- added OWASP ASVS/API/NIST/PCI standards register.

### Reliability and operations

- added durable jobs, retries, dead letters, replay, and circuit behavior;
- added feature flags and payment/payout/compliance kill switches;
- added incident severity/runbooks, RPO/RTO planning, PITR/restore tests, and postmortems;
- added environment isolation, configuration validation, least-privilege database roles, IaC expectations, and provider termination/failover boundaries;
- added SLOs, actionable alerts, and audit retention.

### Supply chain and verification

- added exact dependency/lockfile/patch/SBOM/provenance rules;
- added migration expand/backfill/contract and application rollback rules;
- added property, contract, failure, load, visual, accessibility, security, browser, and migration tests;
- added a complete release acceptance matrix.


### External compliance and money-lifecycle completeness

- added a versioned external decision register for money-transmission/funds control, seller/PSE/tax, sanctions/AML, adult/card-network/2257, child-safety reporting, IP/DMCA, privacy/biometric, unclaimed-funds and consumer-disclosure ownership;
- added statement-descriptor snapshot and buyer receipt requirements to reduce privacy confusion and unrecognized-charge disputes;
- added typed provider/compliance statuses and fail-closed mock/live boundaries without fabricating legal conclusions;
- added restricted case types and evidence/access-history requirements for legal, IP, child-safety, sanctions and privacy escalations.

### Agent execution and cross-document consistency

- added `09_IMPLEMENTATION_DECISION_LOCK.md` so reversible choices are not repeatedly reconsidered;
- added repository `AGENTS.md` plus scoped Grok skills for financial integrity, provider adapters, security/privacy, auth/recovery, compliance/jurisdiction, UX and final verification;
- added an exact `/goal` invocation for a long-running build;
- separated release-gate and adversarial-test matrices and harmonized all paths/status terms;
- removed unstable section-number references from skills in favor of Bible heading names;
- standardized the staff application path as `apps/ops`;
- standardized external-only state as `BLOCKED_EXTERNAL`.
- added ready-to-copy templates for build status, traceability, ADRs, spec gaps, threat models, data classification, authorization, provider capabilities, state machines, incident runbooks and release evidence.

## Intentionally unresolved external gates

These cannot be truthfully solved inside the Bible and remain blockers only for sandbox/live money:

- selected processor/acquirer and exact merchant/submerchant model;
- provider-approved external adult-delivery compliance obligations;
- creator and buyer age/KYC allocation;
- approved states/countries;
- actual transaction, volume, reserve, payout, refund, and chargeback terms;
- provider-supported payout hold/release and accelerated payout rail;
- money-transmission/state/adult-industry counsel decisions;
- production PCI scope/SAQ validation;
- final buyer-protection/legal policy wording;
- production hosting/email/KYC vendor AUP acceptance.

The provider-independent product, domain model, adapters, ledger, risk/trust engines, ops UI, security, and tests can still be built completely now.

## Remaining reality check

No specification guarantees a flawless first production release. The final Bible instead makes the agent build, test, attack, reconcile, and prove the system before it may call it complete. That is the closest reliable engineering equivalent to “works in one go.”
