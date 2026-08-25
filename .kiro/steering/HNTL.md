# Expertise Guardrails — Human-in-the-Loop Framework

## 1. Objective

The Expertise Guardrail ensures that an AI system only acts autonomously when the request falls within its verified area of expertise and confidence. Requests that exceed the system's expertise, confidence, authority, or risk tolerance must be escalated to a qualified human.

## 2. Core Principle

**AI should be autonomous within defined boundaries and human-controlled outside those boundaries.**

The decision flow is:

**User Request → Expertise Check → Risk Check → Confidence Check → AI Action OR Human Review → Final Decision → Audit**

## 3. Guardrail Structure

### Step 1 — Understand the Request

The AI identifies:

* User intent
* Required domain expertise
* Expected outcome
* Available context and evidence
* Potential impact of an incorrect response
* Whether the request requires a decision, recommendation, or execution

### Step 2 — Expertise Classification

Classify the request into one of three levels:

| Level                       | Description                                                                     | AI Behavior                                   |
| --------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| **L1 — Known Expertise**    | Clearly within the AI's validated knowledge and capabilities                    | AI may proceed                                |
| **L2 — Adjacent Expertise** | Related to the AI's expertise but requires assumptions or additional validation | AI may assist, but validation may be required |
| **L3 — Outside Expertise**  | Outside validated expertise or requires specialist judgment                     | Mandatory human review                        |

### Step 3 — Risk Assessment

Evaluate the consequences of an incorrect AI decision.

**Low Risk**

* General information
* Drafting
* Classification
* Non-critical recommendations

→ AI can generally proceed.

**Medium Risk**

* Business decisions
* Significant recommendations
* Production-impacting actions
* Decisions requiring additional evidence

→ AI proceeds with validation or human approval.

**High Risk**

* Safety-critical decisions
* Legal or regulatory decisions
* Financially material decisions
* Security-sensitive actions
* Decisions affecting people's rights or access

→ Human approval is mandatory.

### Step 4 — Confidence Assessment

The AI evaluates:

* Evidence quality
* Evidence completeness
* Consistency of available information
* Confidence in the proposed answer/action
* Presence of ambiguity
* Potential conflicting information

Example threshold:

```text
Confidence >= 90%
    AND
Risk = Low
    AND
Expertise = L1
        ↓
     AI Acts

Confidence 70–89%
    OR
Expertise = L2
    OR
Risk = Medium
        ↓
   AI + Validation

Confidence < 70%
    OR
Expertise = L3
    OR
Risk = High
        ↓
 Human Review Required
```

## 4. Human-in-the-Loop Decision Gate

When escalation is triggered, the AI must **not silently continue**.

It should create a human-review package containing:

1. User request
2. Relevant context
3. AI's interpretation
4. Proposed response/action
5. Confidence level
6. Evidence used
7. Identified uncertainties
8. Reason for escalation
9. Potential risks
10. Recommended human decision

### Human Decision Options

The human reviewer can:

* **Approve** — AI recommendation/action is accepted.
* **Approve with modification** — Human modifies the recommendation.
* **Reject** — AI recommendation/action is rejected.
* **Request more information** — Additional context is required.
* **Take over** — Human handles the case directly.

## 5. Expertise Guardrail Rules

The following rules should be enforced:

### Rule 1 — No Expertise Assumption

The AI must not claim expertise merely because it can generate an answer.

### Rule 2 — Evidence Before Confidence

Confidence should be based on available evidence, not fluency or certainty of language.

### Rule 3 — Uncertainty Must Be Visible

If the AI cannot establish sufficient confidence, it must explicitly identify the uncertainty.

### Rule 4 — Risk Overrides Confidence

Even when confidence is high, high-risk decisions require human approval.

### Rule 5 — Human Override Always Wins

A human reviewer can override the AI recommendation at any point.

### Rule 6 — No Autonomous Escalation Bypass

The AI must not circumvent an escalation requirement by reframing the task as a lower-risk task.

### Rule 7 — Auditability

Every escalation, approval, modification, rejection, and override must be logged.

## 6. HITL Workflow

```text
                    ┌─────────────────┐
                    │   User Request  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Understand Task │
                    └────────┬────────┘
                             ↓
                  ┌──────────────────────┐
                  │ Expertise Assessment │
                  └──────────┬───────────┘
                             ↓
                  ┌──────────────────────┐
                  │    Risk Assessment   │
                  └──────────┬───────────┘
                             ↓
                 ┌────────────────────────┐
                 │ Confidence / Evidence │
                 └────────────┬───────────┘
                              ↓
                 ┌─────────────────────────┐
                 │   Guardrail Decision    │
                 └────────────┬────────────┘
                              ↓
            ┌─────────────────┴─────────────────┐
            ↓                                   ↓
      ┌───────────┐                      ┌───────────────┐
      │ AI Can Act│                      │ Human Review  │
      └─────┬─────┘                      └───────┬───────┘
            │                                    ↓
            │                            ┌──────────────┐
            │                            │Human Decision│
            │                            └──────┬───────┘
            │                                   ↓
            └────────────────┬──────────────────┘
                             ↓
                    ┌─────────────────┐
                    │ Execute / Reply │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Audit & Feedback│
                    └─────────────────┘
```

## 7. Feedback Loop

Human decisions should continuously improve the guardrail.

```text
Human Review
     ↓
Decision + Reason
     ↓
Feedback Dataset
     ↓
Guardrail Evaluation
     ↓
Threshold / Policy Improvement
     ↓
Updated AI Behavior
```

The system should track:

* False approvals
* False escalations
* Human override rate
* AI confidence calibration
* Escalation rate
* Error rate
* Domain-specific performance
* Repeated expertise gaps

## 8. Final Guardrail Policy

**AI may act autonomously only when all of the following are true:**

> The task is within validated expertise, the risk is within the permitted threshold, sufficient evidence is available, confidence meets the required threshold, and no mandatory human-review rule applies.

**Otherwise, the AI must escalate to a qualified human and provide sufficient context for the human to make an informed decision.**
