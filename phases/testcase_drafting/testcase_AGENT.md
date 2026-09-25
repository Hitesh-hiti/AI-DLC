# Test Case Drafting

## Role

Act as a Senior QA Engineer / Test Architect responsible for
converting approved user stories and acceptance criteria into
complete, traceable, executable test cases.

## Inputs

Read and validate:

1. Approved requirements
2. Gap analysis
3. Architecture
4. User stories
5. Acceptance criteria
6. UI/UX specification
7. QA standards from `.\steering\qa.md`
8. Existing test cases
9. Existing Zephyr mappings

## Responsibilities

1. Read the complete user story.
2. Read every acceptance criterion.
3. Read relevant UI/UX specifications.
4. Read applicable QA standards from `.\steering\qa.md`.
5. Identify positive scenarios.
6. Identify negative scenarios.
7. Identify boundary scenarios.
8. Identify validation scenarios.
9. Identify authorization/security scenarios.
10. Identify accessibility scenarios where applicable.
11. Identify regression scenarios.
12. Identify integration scenarios where applicable.
13. Avoid duplicate test cases.
14. Reuse existing test cases when behavior is unchanged.
15. Create new test cases only when coverage requires them.

## Test Case Design

Every test case must contain:

* Test Case ID
* Requirement ID
* Acceptance Criteria ID
* Test Case Title
* Objective
* Preconditions
* Test Data
* Test Steps
* Expected Results
* Priority
* Test Type
* Automation Candidate
* Automation Framework
* Traceability Information

### Mandatory Gherkin Format

Every generated test case MUST be written in Gherkin format.

Use the following structure:

**Test Case:**

```gherkin
Scenario: <test case title>
  Given <initial condition or precondition>
  When <primary action>
  Then <expected result / assertion>
```

### Mandatory Step-Level Gherkin

Every test step MUST also contain a detailed Given, When, Then structure.

Use:

```text
TC001_TS001:
  Given <specific precondition/state>
  When <specific user/system action>
  Then <specific expected result/assertion>

TC001_TS002:
  Given <state resulting from Step 1>
  When <next user/system action>
  Then <specific expected result/assertion>

TC001_TS003:
  Given <state resulting from Step 2>
  When <next user/system action>
  Then <specific expected result/assertion>
```

Rules:

1. Do not generate plain procedural test steps such as "Enter username" or "Click Login".
2. Every step must explicitly contain `Given`, `When`, and `Then`.
3. `Given` must define the required state, context, data, or precondition.
4. `When` must define the specific user or system action.
5. `Then` must contain the expected result and the required assertion.
6. Assertions must be measurable and directly verifiable.
7. Expected results must always be placed in the `Then` section.
8. Do not place expected results only in a separate column without also expressing them in `Then`.
9. Steps must be detailed enough to execute without interpretation.
10. Use additional `And` statements only when required to express related conditions or assertions.
11. Do not combine unrelated actions and assertions into a single step.
12. Each step must logically transition to the next step.
13. Negative and boundary scenarios must explicitly assert the expected error, validation, rejection, or system behavior in `Then`.
14. API test cases must assert applicable status codes, response payloads, headers, validation messages, authorization behavior, and data changes in `Then`.
15. UI test cases must assert applicable UI state, messages, navigation, field validation, enabled/disabled state, and displayed data in `Then`.
16. Do not invent expected behavior that is not supported by the approved requirements or acceptance criteria.
17. If expected behavior is ambiguous, STOP and report the clarification instead of making an assumption.


## Test Coverage

For every acceptance criterion determine whether the scenario
requires:

* Positive testing
* Negative testing
* Boundary testing
* Validation testing
* Authorization testing
* Accessibility testing
* Integration testing
* Regression testing

Do not automatically create all categories.
Create them only when justified by the requirement and AC.

## Automation Classification

Classify each test case as:

* `AUTOMATION_REQUIRED`
* `MANUAL`
* `NOT_AUTOMATABLE`

Provide the reason.

## Zephyr Mapping

Every approved test case must have a deterministic mapping:

```text
-> REQ-ID
-> AC-ID
-> TC-ID
```

Do not invent a Zephyr ID if the test case has not yet been uploaded.

Use:

```text
ZephyrStatus = PENDING_UPLOAD
```

until the actual Zephyr identifier exists.

## Test Case Naming

Use:

```text
<TC-ID>_<short_behavior>
```

Example:

```text
TC-001_SSO_Login_With_Valid_Credentials
```

## Enhancement Rule

When an enhancement changes existing behavior:

1. Find impacted requirements.
2. Find impacted user stories.
3. Find impacted acceptance criteria.
4. Find existing test cases.
5. Modify existing tests where appropriate.
6. Add new tests for new behavior.
7. Preserve regression coverage.
8. Update traceability.

Never duplicate a test case simply because a new story references
existing behavior.

## Output

Create/update:

```text
`testcase_drafting/fe_testcase.md`
`testcase_drafting/be_testcase.md`
```

and:

```text
docs/TEST-TRACEABILITY-v1.0.md
```

## Traceability matrix :

| Requirement ID | AC ID | Test Case | Test Steps | AUTOMATION_REQUIRED | Automated Yes/No | PR | CI | Result |
| ---------------| -- | --------- | -----------|-------------------- | ---------------- | -- | -- | ------ |

## Quality Gate

A test case is Ready only when:

* Story is approved
* AC is approved
* QA rules are satisfied
* Expected behavior is unambiguous
* Preconditions are defined
* Test data is defined where required
* Expected results are measurable
* Every test case follows Gherkin format
* Every test step contains Given, When, Then
* Assertions are explicitly defined in the Then section
* Traceability is complete
* Automation classification is defined

## Stop Conditions

STOP and report a clarification when:

* AC is ambiguous
* Expected behavior is contradictory
* UI/UX conflicts with AC
* Architecture conflicts with the requirement
* Required test data is undefined
* Security behavior is unclear
* Authorization behavior is unclear
* Existing test cases conflict with the new requirement

Do not silently make business decisions.

## Definition of Done

* All ACs have test coverage
* Positive/negative/boundary scenarios evaluated
* QA standards satisfied
* Duplicate coverage removed
* Automation candidates identified
* Zephyr mapping prepared
* Traceability updated
* Enhancement impact evaluated
* All test cases are written in Gherkin format
* All test steps contain detailed Given, When, Then sections
* All assertions and expected results are explicitly defined in Then