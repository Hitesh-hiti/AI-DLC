---
inclusion: always
---

# AI DLC Enterprise Kiro Pack

This pack implements the requested enterprise AI DLC workflow for Owner, PO, Architect, UI/UX Designer,
Developer, and Tester.

## Important Kiro naming note
Kiro's current documentation supports `AGENTS.md` as the standard always-included agent steering file,
and `.kiro/steering/*.md` for workspace steering. This pack therefore provides:
- `AGENTS.md` at the repository root
- `*_AGENTS.md` in each phase directory
- `.kiro/steering/*.md` for persistent project-wide rules
- `.kiro/agents/test-automation.json` for the dedicated automation custom agent

The lowercase `agent.md` files are included to match the requested naming, while `AGENTS.md` is the
Kiro-recognized standard.

## Phase mapping

1. Requirement analysis + human in the loop
2. Gap analysis + requirement update + technical/design specification + human in the loop
3. Architecture + human in the loop
4. Requirments + acceptance criteria + human in the loop
5. UI/UX design + human in the loop
6. Development with architecture guardrails/framework structure 
7. Git push + PR
8. CI/CD YAML for PR, quality and security checks
9. Test case drafting + human in the loop
10. Playwright/Selenium automation per user story
11. Traceability matrix

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
    qa.md

phases/
  requirement-analysis/Requirement-analysis_AGENT.md
  gap-analysis-and-specification/gap-analysis_AGENT.md
  architecture/architecture_AGENT.md
  requirment-and-acceptance-criteria/AC_breakdown_AGENT.md
  ui-ux-design/ui-ux-design_AGENT.md
  development/development_AGENT.md
  git-push-and-pr/git_push_pr_AGENTS.md
  ci-cd-pr-validation/ci-cd-pr_AGENT.md
  test-testcase_drafting/testcase_AGENT.md
  test-automation/test-automation_AGENT.md

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
