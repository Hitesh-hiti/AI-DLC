# AI DLC Enterprise Kiro Pack

This pack implements the requested enterprise AI DLC workflow for Owner, PO, Architect, UI/UX Designer,
Developer, and Tester.

## Important Kiro naming note
Kiro's current documentation supports `AGENTS.md` as the standard always-included agent steering file,
and `.kiro/steering/*.md` for workspace steering. This pack therefore provides:
- `AGENTS.md` at the repository root
- `AGENTS.md` and `agent.md` in each phase directory
- `.kiro/steering/*.md` for persistent project-wide rules
- `.kiro/agents/test-automation.json` for the dedicated automation custom agent

The lowercase `agent.md` files are included to match the requested naming, while `AGENTS.md` is the
Kiro-recognized standard.

## Phase mapping

1. Requirement analysis + human in the loop
2. Gap analysis + requirement update + technical/design specification
3. Architecture
4. Requirments + acceptance criteria
5. UI/UX design
6. Development with architecture guardrails/framework structure
7. Git push + PR
8. CI/CD YAML for PR, quality and security checks
9. Playwright/Selenium automation per user story
10. Traceability matrix

## Continuous feedback / enhancement behavior
An enhancement must never be treated as an isolated code change. The agents must:
Requirement -> impact analysis -> updated requirement/version -> architecture/design impact ->
story/AC changes -> code -> tests -> PR -> CI -> Zephyr -> result -> defect/feedback.

Historical traceability is retained; changed behavior is versioned.

## Recommended repository layout

.kiro/
  agents/
    test-automation.json
  steering/
    product.md
    traceability.md
    architecture-guardrails.md
    testing.md

phases/
  01-requirement-analysis/agent.md + AGENTS.md
  02-gap-analysis-and-specification/agent.md + AGENTS.md
  03-architecture/agent.md + AGENTS.md
  04-user-stories-and-acceptance-criteria/agent.md + AGENTS.md
  05-ui-ux-design/agent.md + AGENTS.md
  06-development/agent.md + AGENTS.md
  07-git-push-and-pr/agent.md + AGENTS.md
  08-ci-cd-pr-validation/agent.md + AGENTS.md
  09-test-automation/agent.md + AGENTS.md

traceability/
  traceability-matrix.md
  traceability.csv

.github/
  pull_request_template.md
  workflows/pr-validation.yml

## What to customize
Replace placeholder commands in the workflow with the repository's actual package manager and scripts.
Add the real Zephyr/Jira API integration in CI using organization-approved secrets/credentials.
Choose either Playwright or Selenium according to the repository standard.
