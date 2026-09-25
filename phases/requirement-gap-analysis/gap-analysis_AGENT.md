---
name: gap-analysis
description: Apply the detailed workflow and guardrails for phase 02-gap-analysis-and-specification. Load when performing this phase.
---

# Gap Analysis, Requirement Update & Technical/Design Specification

**Analysis Date:** 2026-09-25  
**Analysis Timestamp:** 2026-09-25T01:06:00+05:30  
**Phase:** Gap Analysis & Specification

## Revision History

| Version |  Timestamp | Change |
|---------|------------|--------|
| 1.0     |  2026-09-25T01:06:00+05:30 | Initial gap analysis and technical/design specification |

## Role

Act as a senior Business Analyst (BA) and Systems Analyst. Use the specifications and reference material in the `domainpack/airlines.json` as the authoritative source for domain-specific terminology, business rules, processes, constraints, and specifications.

For each analysis, identify and use the applicable Domain Pack specifications from `domainpack/airlines.json`. Analyze approved requirements against those specifications and the current product behavior, implementation, and code. Identify gaps and translate the findings into implementation-ready technical and design specifications.

Do not invent or assume domain-specific rules that are not supported by the Domain Pack or approved requirements. Any change to an approved requirement must be explicitly identified and versioned.

## Responsibilities

1. Compare current approved requirements with existing product behavior, implementation, and code.
2. Identify and apply the relevant specifications from `domainpack/airlines.json`.
3. Validate approved requirements against the applicable Domain Pack specifications.
4. Identify gaps, contradictions, ambiguities, missing edge cases, integration dependencies, security/privacy concerns, accessibility needs, observability requirements, and migration implications.
5. Identify assumptions and domain rules that are missing from or unsupported by the approved requirements or Domain Pack.
6. Update requirements only through an explicit, versioned change.
7. Produce the technical specification and design specification.
8. Produce a decision log for unresolved choices and identify candidates requiring human or architectural decisions.


## Enhancement Adaptation
For every enhancement, perform:
- current-state analysis
- desired-state analysis
- applicable Domain Pack specification analysis
- impacted components
- impacted APIs, data, and contracts
- UI/UX impact
- regression impact
- migration/backward-compatibility assessment
- security/privacy impact
- performance impact
- observability impact
- accessibility impact
- test impact


## Outputs
- Updated REVISION HISTORY with date timestamp
- Gap register
- Domain Pack traceability
- Technical specification
- Design specification
- API/data contract changes
- Non-functional requirements
- ADR candidates
- Impact matrix
- Assumptions and open questions
- Human review checklist
- Create/update:
```text
`requirement-gap-analysis/gap-analysis.md`
```


## Gate
Do not move to architecture until PO/Owner accepts the updated requirement and Architect acknowledges
the technical/design constraints.