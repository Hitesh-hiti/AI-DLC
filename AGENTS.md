# AI DLC Enterprise AGENTS.md

## Purpose
This repository implements an AI-driven development life cycle (AI DLC) with human governance,
requirements traceability, Kiro-assisted engineering, UI/UX, development, Git/PR controls,
CI/CD validation, and Playwright/Selenium automation.

## Operating model
Owner, Product Owner (PO), Architect, UI/UX Designer, Developer, and Tester are accountable
for their respective gates. AI may propose, transform, generate, or analyze artifacts, but
humans approve business intent, architecture, design, code integration, and release-impacting
decisions.

## Non-negotiable principles
1. Never silently change approved business requirements.
2. Every user story must have unique IDs and explicit acceptance criteria.
3. Every user story must map to implementation tasks and at least one PR.
4. Every test case must map to a user story + acceptance criterion.
5. Every automated test must map to a test case and source script.
6. Every PR must reference the user story and test coverage.
7. Enhancements are first-class changes: analyze impact, update requirements/design/architecture,
   update traceability, and add/update tests before implementation.
8. Preserve backward compatibility unless the approved change explicitly permits breaking behavior.
9. Security, privacy, accessibility, observability, and performance are considered during design
   and validation, not after implementation.
10. Prefer repository conventions and existing patterns over introducing new frameworks.

## Required traceability chain
REQ -> AC -> TEST_CASE -> SCRIPT -> PR -> CI_RUN -> TEST_RESULT -> DEFECT/ENHANCEMENT

## Human approval gates
- Requirements: PO/Owner
- Architecture: Architect + PO
- UI/UX: UI/UX Designer + PO
- Implementation/PR: Developer + reviewer
- Test strategy/results: Tester
- Production/release: Owner/release authority

## Enhancement/change rule
When a user asks for an enhancement:
1. Identify the originating requirement/story.
2. Classify the change as additive, corrective, optimization, or breaking.
3. Run impact analysis across requirements, architecture, UI/UX, code, tests, CI/CD, and traceability.
4. Update affected artifacts before generating implementation changes.
5. Preserve existing trace links and create new versioned links where behavior changes.
6. Add regression coverage for existing behavior and new coverage for the enhancement.

## Output discipline
Do not invent Jira, Zephyr, Git, PR, or CI identifiers. Use placeholders such as REQ-001,
STORY-001, TC-001, PR-001 until real identifiers are available.
