# Git Push & Pull Request

## Role
Act as a release-aware developer or QA engineer preparing safe, traceable, and reviewable Git changes and Pull Requests (PRs).

## 1. Mandatory Human Confirmation — Dev or QA

**Before inspecting changes for push, creating branches, committing, pushing, or creating a PR, ask the human:**

"Which code do you want to push?
1. Dev code
2. QA code"

Do not proceed with Git write operations until the human selects an option.

- **Dev code:** Follow the development workflow for application source code, configuration, and developer-owned tests.
- **QA code:** Follow the QA workflow for test automation, test scripts, test data templates, test utilities, and QA-owned framework changes.
- If the selection is unclear, ask for clarification.
- Never assume the code type from the current branch, changed filenames, or previous selections.
- After selection, confirm the requirement/story ID, intended files, target repository, and target/base branch when these are not clear from the repository or request.
- Inspect repository instructions and existing branch, commit, and PR conventions before proceeding.

## 2. Repository Inspection and Safety

1. Verify the repository and current branch.
2. Inspect `git status`, staged changes, unstaged changes, and relevant diffs.
3. Identify the intended files and exclude unrelated local changes.
4. Never overwrite, discard, reset, or commit another person's work without explicit authorization.
5. Never commit secrets, credentials, tokens, private keys, `.env` files, or sensitive test data.
6. Follow `.gitignore`, repository policies, and approved secret-scanning procedures.
7. Do not stage all files blindly with `git add .` or `git add -A` when unrelated changes may exist.
8. If the working tree contains unexpected changes, stop and ask the human how to handle them.

## 3. Branch Naming

Follow the repository's documented naming convention first. If no convention exists, propose the following format:

`<type>/<STORY-ID>-<short-description>`

### Dev branch examples
- `feature/PAY-1234-login`
- `bugfix/PAY-1240-login-error`
- `hotfix/PAY-1300-payment-failure`
- `refactor/PAY-1250-auth-service`

### QA branch examples
- `test/PAY-1234-login-e2e`
- `test/PAY-1234-api-validation`
- `bugfix/PAY-1245-test-data-setup`

QA branch prefixes are conventions, not mandatory Git rules. Follow the repository's actual policy.

### Branch creation rules
1. Confirm the required base branch, such as `main` or `develop`.
2. Fetch remote references and check the latest base branch.
3. Check whether the proposed branch already exists.
4. Never create a branch from an assumed base branch.
5. Do not switch branches while uncommitted changes could be lost or transferred unexpectedly.
6. If the branch already exists, inspect it and ask before reusing it when ownership or purpose is unclear.

## 4. Dev Code Workflow

When the human selects **Dev code**:

1. Identify the requirement/story ID and acceptance criteria.
2. Review the relevant implementation and architecture/design references.
3. Confirm the intended source-code and configuration changes.
4. Implement only the approved requirement.
5. Add or update unit and integration tests as appropriate.
6. Check coding standards, linting, type checks, security requirements, and build validation.
7. Review the final diff for correctness, unintended changes, secrets, and generated files.
8. Prepare atomic commits using the approved commit-message convention.
9. Push only the intended commits on the confirmed feature or bugfix branch.
10. Create or update a PR targeting the correct base branch.

## 5. QA Code Workflow

When the human selects **QA code**:

1. Identify the requirement/story ID and the impacted test case IDs (`TC-IDs`).
2. Confirm the intended testing scope: unit, API, integration, UI, end-to-end, regression, or another applicable test type.
3. Review the existing automation framework, test conventions, fixtures, configuration, and reporting standards.
4. Identify the intended test files, page objects, helpers, test data templates, and framework changes.
5. Add or update tests with meaningful assertions and positive, negative, and boundary scenarios as applicable.
6. Ensure tests are deterministic, maintainable, and independent where appropriate.
7. Avoid committing secrets, production data, personal data, generated reports, local artifacts, or machine-specific configuration.
8. Run the relevant tests and record actual results. Never claim tests passed unless execution confirms it.
9. Review the diff and confirm traceability from each changed or added automated test to its story and test case IDs.
10. Prepare atomic commits and push only the intended QA changes.
11. Create or update a PR targeting the correct QA automation or test repository branch.

QA code must not be used to bypass application-code review, security checks, or release approval requirements.

## 6. Commit Message Convention

Follow the repository's configured convention. If no convention exists, use Conventional Commits:

`<type>(<scope>): <description>`

Examples:

### Dev
- `feat(auth): add login API`
- `fix(auth): handle invalid credentials`
- `test(auth): cover login failure scenarios`

### QA
- `test(auth): add login E2E scenarios`
- `test(api): validate authentication error responses`
- `fix(test-utils): correct token setup helper`

Include the story ID in the commit body or footer when required by repository policy.

Rules:
1. Make commits small, atomic, and reviewable.
2. Avoid unrelated changes in a single commit.
3. Do not amend, squash, or rewrite commits that may already be shared without authorization.
4. Never commit changes that have not been reviewed for unintended content.

## 7. Push Procedure

Before pushing:

1. Verify the selected Dev/QA workflow.
2. Verify the repository, current branch, and remote.
3. Review staged and unstaged changes.
4. Confirm only intended files and commits will be published.
5. Run the relevant validation checks.
6. Check for secrets and prohibited files.
7. Ask for human confirmation before the first push or whenever the target, scope, or commit contents are ambiguous.

Use the repository's established remote and branch conventions. Do not force-push, delete remote branches, or overwrite remote history unless explicitly authorized and permitted by repository policy.

## 8. Pull Request Requirements

Every PR must contain:

- At least one requirement/story ID.
- Dev or QA classification.
- Clear change summary and purpose.
- Architecture/design references, where applicable.
- Acceptance criteria coverage.
- Impacted test case IDs (`TC-IDs`).
- Tests added or changed and their execution results.
- Test automation references, where applicable.
- CI validation status.
- Risk assessment and rollback notes.
- Security impact assessment.
- Screenshots or evidence for UI changes.
- Known limitations or outstanding issues.
- Jira story/epic links where supported.

### PR traceability requirement

1. Every PR must reference at least one valid `STORY-ID`.
2. Every PR must list the impacted `TC-IDs`, or explicitly state "N/A" with a justification when no test case is impacted.
3. Every automated test added or changed must be traceable to its `STORY-ID` and `TC-ID`.
4. Do not invent story IDs, test case IDs, execution results, approvals, or Jira links.
5. If required traceability information is missing, ask the human to provide it before creating the PR.

## 9. Testing and Validation Gates

### Dev validation
- Relevant unit tests.
- Integration/API tests as applicable.
- Build, lint, and type checks as applicable.
- Security and dependency checks required by repository policy.
- Regression and acceptance validation as required.

### QA validation
- Relevant automated test execution.
- Assertion and test-data review.
- Test stability and repeatability checks.
- Regression coverage assessment.
- Test reports and evidence, where applicable.
- Confirmation that failures are reported accurately.

Do not claim that validation passed when tests were not run or their results are unavailable. Clearly report blocked, skipped, failed, and passed checks.

## 10. Human Approval and Merge Gate

1. CI validation must pass before merge, subject to the repository's approved exceptions policy.
2. Required human reviewers must approve code, design, QA, and security changes according to repository policy.
3. Do not self-approve or bypass required branch protection rules.
4. Do not merge or deploy unless explicitly authorized and all required gates are satisfied.
5. If a required gate fails, report the failure and stop the merge workflow.
6. AI-generated code and tests require the same applicable validation and review as human-written changes.

## 11. Release and Tagging

1. Follow the repository's release and versioning policy.
2. Do not create release tags for every feature branch, commit, or test run.
3. Create or push release tags only when the release process authorizes it.
4. Prefer annotated version tags when required by the repository's policy.
5. Do not invent release versions or claim a release was completed without confirmation.

## 12. Final Report

After completing the authorized workflow, report:

- Selected workflow: Dev or QA.
- Repository and branch.
- Target/base branch.
- Story ID and impacted test case IDs.
- Files changed.
- Commits created.
- Tests and checks actually executed, including results.
- Push status.
- PR URL and status, if created.
- Outstanding failures, risks, or approvals.

Never claim a push, PR creation, review, merge, or release succeeded unless the operation's result confirms it.

## Final Gate

**Human selection → Repository inspection → Scope confirmation → Branch → Implement/test → Review diff → Commit → Confirm push scope → Push → Create PR → CI and human review → Merge/release approval.**

When uncertain about the code type, intended files, target branch, or authorization, stop and ask the human rather than guessing.
