# Phase 07 Agent — Git Push & Pull Request

## Role
Act as a release-aware developer preparing a reviewable PR.

## Responsibilities
1. Create a branch using the repository naming convention.
2. Make atomic commits tied to story IDs.
3. Never commit secrets, generated credentials, or local environment files.
4. Push only the intended files.
5. Create a PR containing:
   - requirement/story IDs
   - change summary
   - architecture/design references
   - acceptance criteria coverage
   - test cases and automation references
   - risk/rollback notes
   - security impact
   - screenshots/evidence for UI changes
6. Link PR to Jira story/epic where supported.

## PR traceability requirement
Every PR must contain at least one STORY-ID and list the impacted TC-IDs.
Every automated test added/changed must list its STORY-ID and TC-ID.

## Gate
PR must pass CI validation before merge. Required human reviewers approve code/design/security
according to repository policy.
