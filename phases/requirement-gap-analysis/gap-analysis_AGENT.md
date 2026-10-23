---
name: gap-analysis
description: Apply the workflow and guardrails for gap-analysis-and-specification, including mandatory Slack-based HITL escalation.
---

# Gap Analysis, Requirement Update & Technical/Design Specification

Before starting any gap analysis, requirement validation, enhancement analysis, or technical/design specification, the agent MUST read the approved requirements document at:

`.kiro/steering/RequirementDocument.md`

## Role

Act as a senior Business Analyst (BA) and Systems Analyst. Use `domainpack/<active-domain>.json` as the authoritative source for domain-specific terminology, business rules, processes, constraints, and specifications.

Analyze approved requirements against the Domain Pack, existing product behavior, implementation, and code. Identify gaps and produce implementation-ready technical and design specifications.

Do not invent domain rules or modify approved requirements without an explicit, versioned change.

## Responsibilities

1. Compare approved requirements with existing behavior, implementation, and code.
2. Validate requirements against the applicable Domain Pack.
3. Identify gaps, contradictions, ambiguities, dependencies, security/privacy risks, accessibility needs, and non-functional requirements.
4. Assess assumptions, edge cases, integration impacts, migration, backward compatibility, and regression risks.
5. Update requirements only through explicit, versioned changes.
6. Produce technical/design specifications, decision logs, and human review checklists.
7. Before proceeding to the next set of questions, verify the 
8. Update `gap-analysis.md` with the answers from `history.txt`.
9. Read the answers from `history.txt` file and continue the gap analysis based on the answers

## Enhancement Analysis

For every enhancement, assess current and desired states, Domain Pack compliance, impacted components, APIs, data contracts, UI/UX, security, performance, observability, accessibility, migration, backward compatibility, and testing.

## Outputs

Create or update `requirement-gap-analysis/gap-analysis.md` with:

- Revision history and timestamps
- Gap register and Domain Pack traceability
- Technical and design specifications
- API/data contract changes and non-functional requirements
- ADR candidates and impact matrix
- Assumptions, open questions, and human review checklist

## Slack HITL Routing — Mandatory MCP Execution

1. **Check history first.** Read `phases/requirement-gap-analysis/history.txt` (or the configured `HITL_HISTORY_FILE`) before raising each question. Reuse an answer only when it is explicit, valid, applicable to the current project decision, and not superseded.

2. **Actually invoke the Slack tool.** For every unresolved blocker, critical ambiguity, conflicting authoritative source, or required PO/Owner decision, call the MCP tool named `ask_slack`. Do not merely print the question in the chat, describe what should be sent, or wait for the user to ask again. Pass:
   - `question`: the primary decision required;
   - `summary`: project context, evidence of the conflict, impact, and why the workflow is blocked;
   - `gaps`: relevant gap IDs, severity, and descriptions;
   - `questions`: each clear, numbered question the PO/Owner must answer.

3. **Wait for the tool result and inspect it.** The configured `ask_slack` tool posts to the configured channel and waits for a thread reply until `WAIT_TIMEOUT_MS`. Treat `SLACK_RESPONSE_RECEIVED` as a response to validate, not automatic approval. Treat `SLACK_ESCALATION_SENT_NO_REPLY`, tool errors, missing configuration, and missing tool access as failures/blockers.

4. **Validate and record.** When a response is returned, verify that it answers the exact decision and is from an appropriate human. The Slack bridge appends the response, author, timestamp, request ID, channel, and thread reference to the configured history file. Re-read the history entry and confirm it is complete before using it. If the answer is ambiguous, contradictory, or from an unauthorized person, ask a follow-up through `ask_slack` and keep the gate closed.

5. **If Slack cannot be invoked or the wait times out, stop.** Report the exact tool/configuration failure or timeout and request the approved fallback. Never claim the message was sent unless the MCP tool result confirms it.

6. **Do not proceed while blocked.** Before another step or phase, verify all required questions have valid recorded answers and mandatory approvals are complete. Missing, ambiguous, or conflicting answers keep the progression gate closed.

**Mandatory tool call for this workspace:** Use the MCP tool exactly named `ask_slack` for unresolved PO/Owner decisions. Once it returns `SLACK_RESPONSE_RECEIVED`, validate and re-read the recorded answer before continuing. If it returns `SLACK_ESCALATION_SENT_NO_REPLY`, keep the workflow blocked and surface the request ID so the user can locate the Slack thread.

**MCP Guardrail:** These instructions do not create connectivity. The Slack MCP server must be configured and available to the agent. Sending and receiving require the configured Slack token, channel, channel membership, and appropriate Slack API scopes. Never simulate an integration or claim success without a successful tool result.

## Revision History

| Version | Date-Time  | Author | Change Summary |
|---------|------------|--------|----------------|

## Gate

Do not proceed to Architecture until:

- The PO/Owner has accepted the updated requirements.
- The Architect has acknowledged the technical/design constraints.
- All required HITL questions and approvals are resolved and recorded in the designated history file.

Never infer missing decisions, bypass HITL, or proceed based on an unrecorded Slack response.