---

name: development
description: Apply the development guardrails for phase 06-development when implementing approved stories, defects, or enhancements. Architecture and CI/CD governance are handled by separate guardrails.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Development Guardrails

## 1. Role

Act as a senior software engineer implementing approved requirements within the project's established architecture, coding standards, UI standards, accessibility requirements, security/privacy controls, and testability conventions.

Follow existing project patterns before introducing new ones.

---

## 2. Inputs

Use the following as the source of truth:

* Approved requirements
* Technical/design specification
* Approved architecture
* User stories and Acceptance Criteria (AC)
* UI/UX designs
* Existing codebase patterns
* Existing component/design-system conventions
* API contracts
* HTML/CSS standards
* Accessibility standards
* Security/privacy requirements
* Existing test and test-automation conventions

Do not redefine architecture or CI/CD rules in this phase.

---

## 3. Development Principles

1. Inspect the existing implementation before coding.
2. Reuse existing approved patterns and components.
3. Implement only approved scope.
4. Keep changes minimal, focused, maintainable, and reviewable.
5. Preserve existing behavior outside the approved scope.
6. Do not introduce unnecessary abstractions or dependencies.
7. Do not bypass established framework or design-system patterns.
8. Do not introduce new conventions when an approved convention already exists.
9. Make implementation deterministic and testable.
10. Do not make assumptions where requirements or existing conventions are ambiguous; follow the approved specification or raise the ambiguity.
11. Create unit test case

---

# 4. Code and Dependency Guardrails

* Follow the project's language, framework, naming, formatting, and error-handling conventions.
* Reuse existing utilities, services, components, hooks, and libraries where applicable.
* Do not introduce a new dependency when an existing approved dependency provides the required capability.
* Any required new dependency must follow the project's dependency-approval process.
* Do not introduce unrelated refactoring, upgrades, migrations, or cleanup.
* Avoid duplicated business logic and sources of truth.
* Preserve backward compatibility unless the approved requirement explicitly changes it.
* Do not hard-code environment-specific values or secrets.

---

# 5. Security and Privacy

Treat external input as untrusted.

* Validate input at appropriate trust boundaries.
* Enforce authorization server-side.
* Never rely on client-side authorization or UI state for security.
* Use approved authentication and security mechanisms.
* Prevent applicable injection, XSS, CSRF, SSRF, path traversal, and unsafe-deserialization risks.
* Use framework-provided secure APIs and encoding mechanisms.
* Do not implement custom cryptography.
* Never expose secrets, credentials, tokens, or private configuration in source code, client bundles, HTML, CSS, URLs, logs, or telemetry.
* Do not expose sensitive implementation details through error messages.
* Follow applicable security and compliance requirements.

### Privacy / GDPR

Where personal data is processed:

* Apply data minimization.
* Process only data required for the approved purpose.
* Do not expose personal or sensitive data unnecessarily.
* Do not place personal data in DOM attributes, URLs, browser storage, logs, analytics, or telemetry unless explicitly required and approved.
* Follow applicable consent, purpose-limitation, retention, deletion, and access-control requirements.
* Do not introduce new collection or storage of personal data without approval.
* Use anonymized, masked, or synthetic data for development/testing where required.
* Follow the project's approved privacy/data-classification policy.

---

# 6. Accessibility — WCAG / W3C

Implement UI according to the project's approved accessibility target, based on **WCAG** and applicable **W3C** standards.

### General

* Prefer semantic HTML.
* Use native HTML semantics before ARIA.
* Use ARIA only when necessary and correctly.
* Do not use ARIA to recreate native HTML behavior unnecessarily.
* Ensure keyboard accessibility.
* Ensure visible focus states.
* Ensure meaningful accessible names, descriptions, roles, states, and relationships.
* Do not rely on color alone to convey information.
* Follow the project's approved color-contrast requirements.
* Ensure dynamic content and state changes are accessible.
* Ensure form controls have appropriate labels and error messaging.
* Ensure interactive elements have clear purpose and state.

### Images

Every `<img>` must contain `alt`.

* Informative image → meaningful alternative text.
* Decorative image → `alt=""`.
* Functional image → alternative text describes the action/purpose.
* Avoid redundant alternative text when equivalent accessible/visible text already exists.

### Accessibility Validation

Where applicable, verify:

* Keyboard navigation
* Focus behavior
* Accessible names
* Labels and instructions
* Error identification
* Dynamic state changes
* Screen-reader semantics
* Contrast
* Responsive/reflow behavior
* Zoom/text resizing behavior

Follow the project's defined accessibility testing process; do not treat automated accessibility tooling as a substitute for required manual verification.

---

# 7. HTML / W3C Standards

* Produce valid, standards-compliant HTML.
* Prefer semantic elements and standard attributes.
* Follow existing framework and design-system conventions.
* Use `data-*` attributes for application-specific metadata when required.
* Do not introduce arbitrary/custom attributes.
* Reuse existing attributes before creating new ones.
* Attribute names must be descriptive, consistent, valid, and appropriately scoped.
* Properly escape dynamic attribute values.
* Do not expose secrets or sensitive information through HTML attributes.
* Do not use HTML attributes as security controls.
* Avoid duplicate mechanisms for the same state or behavior.
* Preserve existing DOM behavior outside approved scope.

---

# 8. CSS Guardrails

* Follow the project's existing styling architecture.
* Reuse design tokens, CSS variables, and existing component styles.
* Avoid unnecessary specificity.
* Avoid duplicate selectors and styling mechanisms.
* Avoid unintended global styles.
* Avoid inline styles unless explicitly approved.
* Follow the project's established mechanism for component state.
* If attribute-driven styling is the approved project convention, use the corresponding attribute selectors consistently.
* Do not introduce duplicate class/attribute state mechanisms.
* Preserve responsive and existing visual behavior.
* Follow applicable design-system and accessibility requirements.

---

# 9. Testability — Preparation for Phase 07

Implementation must be **automation-friendly** so the next test-automation phase can reliably verify the Acceptance Criteria.

* Implement deterministic behavior.
* Keep business logic separable and testable.
* Avoid unnecessary timing dependencies.
* Avoid arbitrary waits or sleep-based behavior.
* Use stable component behavior and state transitions.
* Follow existing testability conventions.
* Reuse approved selectors and test attributes where the project defines them.
* Prefer semantic locators based on accessible names, roles, labels, and visible behavior.
* Use approved `data-*` test attributes only when semantic identification is insufficient.
* Do not use fragile selectors based on:

  * Generated CSS classes
  * DOM position
  * Styling implementation
  * Random/generated IDs
  * Unstable text where a stable semantic identifier exists
* Do not add test-only hooks unnecessarily.
* Do not expose sensitive data merely to make automation easier.
* Keep UI state observable through legitimate user-facing behavior or approved test attributes.

### Important

Phase 06 is responsible for making the implementation **testable**.

Phase 07 is responsible for implementing and validating the **test automation strategy**.

Do not duplicate Phase 07's automation responsibilities in this phase.

---

# 10. Error Handling

* Follow existing project error-handling patterns.
* Handle expected errors explicitly.
* Provide meaningful user-facing error states where applicable.
* Do not expose stack traces, internal paths, database details, secrets, or infrastructure information.
* Ensure validation errors are accessible.
* Do not silently swallow errors.
* Preserve consistent API/UI error contracts.

---

# 11. Observability

Follow existing project observability conventions.

Where applicable:

* Add required structured logging.
* Preserve correlation/request identifiers.
* Emit required business or operational events.
* Ensure important failures are observable.
* Do not log passwords, tokens, secrets, or prohibited personal/sensitive data.
* Do not introduce a new logging/telemetry mechanism when an approved mechanism already exists.

---

# 12. Scope and Regression Protection

For enhancements or defect fixes:

* Preserve existing behavior outside the approved change.
* Identify behavior that could regress.
* Add appropriate regression coverage according to project conventions.
* Do not modify unrelated functionality.
* Do not perform broad refactoring to support a narrowly scoped change unless approved.

---

# 13. Development Validation

Before considering the implementation complete, verify applicable requirements.

### Functional

* Acceptance Criteria are implemented.
* Expected behavior works.
* Validation and error paths behave correctly.
* Existing behavior outside scope is preserved.

### Code

* Existing project patterns are followed.
* No unnecessary abstraction is introduced.
* No unrelated files are modified.
* No unauthorized dependency is introduced.

### Security / Privacy

* Inputs are appropriately validated.
* Authorization remains server-side.
* No secrets are exposed.
* No prohibited personal/sensitive data is exposed.
* Applicable privacy/security requirements are satisfied.

### Accessibility

* Semantic HTML is used.
* Keyboard interaction works.
* Accessible names/labels/states are correct.
* Images have appropriate `alt` attributes.
* Relevant WCAG requirements are satisfied.
* Relevant accessibility checks are completed.

### HTML / CSS

* HTML is valid and standards-compliant.
* No duplicate/invalid attributes exist.
* Custom attributes follow approved conventions.
* CSS follows project conventions.
* Responsive behavior is preserved.
* No unintended global styling is introduced.

### Testability

* Changed behavior can be deterministically identified and exercised.
* Approved selectors/test hooks are used where necessary.
* No fragile automation dependency has been introduced.
* Implementation is ready for Phase 07 test automation.

---

# 14. Definition of Done

The development phase is complete when:

* Approved Acceptance Criteria are implemented.
* Approved scope is respected.
* Existing architecture and project conventions are followed.
* Security and privacy requirements are satisfied.
* Applicable GDPR/privacy requirements are satisfied.
* Applicable WCAG/W3C accessibility requirements are satisfied.
* HTML/CSS standards are satisfied.
* Required development-level tests pass.
* Regression risks are addressed.
* Implementation is deterministic and automation-friendly.
* Required observability is implemented.
* Documentation/traceability is updated where required.
* No unrelated functionality has been changed.
* The implementation is ready for Phase 07 test automation.

---

# 15. Engineering Rule

> **Implement only what is approved, follow the existing architecture and project conventions, build accessible and secure standards-compliant UI, protect privacy, preserve existing behavior, and leave the implementation deterministic and testable for the next phase.**

---

## Development Completion Gate

When development is completed, create a **Development Completed Breakdown** containing:

* **Status:** Development Completed / approved project status.
* **Completion %:** Actual verified implementation percentage.
* **Traceability:** Requirement → Story → Acceptance Criteria → Architecture → Implementation.
* **Implementation Summary:** What was implemented, including completed scope and key changes.
* **Acceptance Criteria:** Each AC with implementation status.
* **Security & Privacy:** Validation, authorization, GDPR/privacy controls, and sensitive-data handling.
* **Accessibility:** WCAG/W3C requirements implemented and verification status.
* **HTML/CSS:** Standards compliance and relevant UI implementation details.
* **Testability:** Deterministic behavior, semantic locators/test hooks, and Phase 07 readiness.
* **Validation:** Functional, code, security/privacy, accessibility, HTML/CSS, and regression checks performed during development.
* **Exceptions/Deviations:** Approved deviations, known issues, assumptions, and follow-ups.
* **Impact:** Affected modules/components and potential regression areas.
* **Documentation:** Required implementation/documentation updates.
* **Revision History:** Preserve all previous revisions and record:
  * Version
  * Date
  * Timestamp with timezone
  * Status
  * Completion %
  * Change summary
  * Reason
  * Owner/Actor
* **Phase Handoff:** Explicitly confirm **Ready for Phase 07 – Test Automation**.

### Completion Rule

Development is **not complete** until the breakdown is recorded and traceability, status, completion %, and revision history are updated.

Use ISO 8601 timestamps with timezone, e.g. `2026-09-18T12:16:00+05:30`.

**Never report a higher completion status or percentage than the actual verified implementation. Never overwrite previous revision history.**

---

## Output

Create/update:

```text
`development/development-completed-breakdown.md`
```
---

## Gate

Do not start development until all required upstream approvals are complete:

* **PO/Owner has accepted the approved requirements and Acceptance Criteria.**
* **Architect has acknowledged the applicable technical/design constraints and approved architecture.**
* Required UI/UX/design artifacts are approved where applicable.
* Required security, privacy, compliance, or accessibility constraints are identified where applicable.

If any required approval or constraint is missing, ambiguous, or conflicting:

* Do not begin implementation.
* Do not infer approval.
* Do not modify requirements to resolve the issue.
* Raise the issue to the appropriate owner for resolution.

**Development must implement the approved requirements and constraints; it must not redefine them.**