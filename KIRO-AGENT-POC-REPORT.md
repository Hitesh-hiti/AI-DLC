# Kiro Agent Routing Framework — Final Report
## Reusable AIDLC/SDLC Model Routing Architecture

**Date:** August 31, 2026
**Version:** 2.0 — Reusable Framework (replaces POC v1.0)
**Status:** Complete
**Project:** Northstar E-commerce (first deployment of framework)

---

## 1. Existing AIDLC/SDLC Process — Analyzed

The Northstar project uses an **AIDLC (AI-assisted Development Lifecycle)** derived from the HNTL (Human-in-the-Loop) framework established in `.kiro/steering/HNTL.md`.

### Lifecycle Phases (from existing project artifacts)

| Phase | Artifacts | Status |
|---|---|---|
| Inception / Requirements | gap-analysis.md (15 decisions, HNTL framework) | ✅ Complete |
| Design | design-specification.md, wireframes.md, design-phase-checklist.md | ✅ Complete |
| Technical Design | technical-specification.md, backend/openapi.yaml | ✅ Complete |
| Development (Backend) | backend/src/**, 9 endpoints, 6 DB tables | ✅ Week 1 Complete |
| Development (Frontend) | React/Vite — not started | ⏳ Week 2 |
| Testing | Jest + Supertest, 10 test files, 65+ tests, 85%+ coverage | ⏳ Week 3 |
| Code Review | — | ⏳ Pending |
| Documentation | backend docs complete, frontend pending | ⏳ Partial |
| Release / Deployment | Docker, Nginx — planned | ⏳ Week 4 |

### Key Lifecycle Rules Preserved from Existing Process

- **HNTL confidence scoring:** L1/L2/L3 expertise classification, Low/Medium/High risk assessment — now embedded in Design Agent and Router
- **Ambiguity priority order:** DEBUGGING > DEVELOPMENT > CODE_REVIEW > TESTING > DESIGN > REQUIREMENT > DOCUMENTATION — migrated to Router
- **Phase output chain:** gap-analysis → design-spec → technical-spec → implementation → tests → documentation — captured in framework-project-config.md §10–§11
- **GDPR/compliance rules:** consent_given enforcement, 1-year retention — captured in framework-project-config.md §4–§5
- **>80% coverage target** — captured in framework-project-config.md §6

---

## 2. Existing POC (v1.0) — Analyzed

### What the POC Had

| File | What It Did | Problem |
|---|---|---|
| router-agent.json | Phase detection + delegation | Hardcoded "Northstar e-commerce project" throughout; project-specific resources baked in |
| design-agent.json | Requirements + design | PROJECT CONTEXT section with Northstar DB/stack specifics in agent instructions |
| development-agent.json | Implementation | Northstar-specific architecture details in instructions |
| qa-agent.json | Testing | Hardcoded list of Northstar test files + endpoint list in instructions |
| debugging-agent.json | Failure analysis | Northstar-specific failure patterns (ECONNREFUSED, ERR_ERL_KEY_GEN_IPV6) in instructions |
| code-review-agent.json | Code review | Northstar-specific GDPR/Joi/rate-limit rules in review checklist |
| documentation-agent.json | Documentation | Hardcoded list of Northstar documentation files |
| sdlc-phase-observer.json | Hook observability | Hardcoded 'econnrefused', 'supertest', 'jest' as phase detection keywords |
| KIRO-AGENT-POC-REPORT.md | Report | POC-scoped report |

### Root Problems Identified

1. **Project logic inside agent instructions** — any project change required editing agent JSON files
2. **No separation between framework and project** — couldn't reuse agents on a different project
3. **Model policy scattered** — model names duplicated in router instructions AND each agent
4. **No centralized project config** — project context (tech stack, test files, endpoints) spread across 6 agents

---

## 3. Migration — What Changed, What Was Preserved

### Migrated (preserved, moved to better location)

| Concept | Old Location | New Location |
|---|---|---|
| Northstar tech stack | development-agent.json instructions | framework-project-config.md §2 |
| DB schema (6 tables) | development-agent.json instructions | framework-project-config.md §4 |
| API endpoints list | qa-agent.json instructions | framework-project-config.md §5 |
| Testing framework + commands | qa-agent.json instructions | framework-project-config.md §6 |
| Existing test files list | qa-agent.json instructions | framework-project-config.md §6 |
| Coding conventions | development-agent.json instructions | framework-project-config.md §7 |
| Existing documentation files | documentation-agent.json instructions | framework-project-config.md §8 |
| Known failure patterns | debugging-agent.json instructions | framework-project-config.md §9 |
| AIDLC phase state | AI_HANDOFF.md (implicit) | framework-project-config.md §10 |
| Design artifacts list | design-agent.json resources | framework-project-config.md §11 |
| Model assignments | router-agent.json instructions | framework-model-policy.md |
| HNTL L1/L2/L3 framework | HNTL.md (steering) | Design Agent + Router instructions (references HNTL.md) |
| Ambiguity priority order | router-agent.json instructions | router-agent.json (retained, now generic) |
| Phase detection keywords | router-agent.json + hook | router-agent.json (retained, generalized + lifecycle-normalized) |

### Replaced (project-specific content removed from agents)

All 6 specialist agents now contain only generic engineering behavior.
All project-specific context is loaded at runtime from `framework-project-config.md` (steering, always-included).

### Removed

Nothing was discarded. All useful lifecycle knowledge was migrated to `framework-project-config.md` or `framework-model-policy.md`.

---

## 4. Final Framework Architecture

```
                          USER
                            |
                            v
                   @Northstar Router
                            |
                    reads on every task
                    /                \
    framework-model-policy.md    framework-project-config.md
    (global model assignments)   (project identity, tech stack,
                                  lifecycle state, overrides)
                            |
                    PHASE DETECTION
                    (lifecycle normalization
                     + keyword/intent matching
                     + HNTL confidence scoring)
                            |
          +-----------------+------------------+
          |        |        |        |         |
          v        v        v        v         v
       DESIGN    DEV     TESTING   DEBUG    REVIEW   DOCS
          |        |        |        |         |       |
          v        v        v        v         v       v
      Design    Dev      QA      Debugging  Review   Docs
      Agent     Agent    Agent    Agent     Agent    Agent
          |        |        |        |         |       |
          v        v        v        v         v       v
      Sonnet    Sonnet   Haiku    Sonnet    Sonnet  MiniMax
       4.5        4       4.5       4        4.5     M2.1

                    SDLC Phase Observer Hook
                    (UserPromptSubmit — fires on every message,
                     prints phase hint for any agent session)
```

---

## 5. Framework Layers

| Layer | File | Purpose | Project-Specific? |
|---|---|---|---|
| 1 — Model Policy | `.kiro/steering/framework-model-policy.md` | Global model assignments, fallback strategy | No |
| 2 — Project Config | `.kiro/steering/framework-project-config.md` | Project identity, tech stack, endpoints, test files, overrides | Yes — replace per project |
| 3 — Router | `.kiro/agents/router-agent.json` | Lifecycle normalization, phase detection, delegation | No |
| 4 — Specialist Agents | `.kiro/agents/*.json` (6 files) | Generic engineering behavior per phase | No |
| 5 — Observability Hook | `.kiro/hooks/sdlc-phase-observer.json` | Phase hint on every prompt, any agent | No |
| 6 — HNTL Steering | `.kiro/steering/HNTL.md` | Risk and confidence framework (existing, preserved) | No |

---

## 6. All Files — Created, Replaced, Retained

### Created (New in v2.0)

| File | Purpose |
|---|---|
| `.kiro/steering/framework-model-policy.md` | Centralized model policy, fallback strategy |
| `.kiro/steering/framework-project-config.md` | Northstar project configuration (tech stack, endpoints, test files, known issues, lifecycle state) |

### Replaced (Rewritten in v2.0)

| File | What Changed |
|---|---|
| `.kiro/agents/router-agent.json` | Now lifecycle-agnostic; supports AIDLC/SDLC/Agile/Custom; reads project config from steering; expanded lifecycle normalization; improved observability format with Lifecycle and Routing Category fields; HNTL confidence scoring added |
| `.kiro/agents/design-agent.json` | Removed Northstar PROJECT CONTEXT section; agent now reads project config from steering; HNTL framework behavior made explicit; generic API/DB design output formats added |
| `.kiro/agents/development-agent.json` | Removed Northstar stack details from instructions; agent reads project config from steering; generic implementation workflow documented |
| `.kiro/agents/qa-agent.json` | Removed hardcoded test file list and endpoint list; reads framework from project config; generic test case generation format added |
| `.kiro/agents/debugging-agent.json` | Removed Northstar-specific failure patterns from instructions (now in project config §9); generic failure classification guide retained and improved |
| `.kiro/agents/code-review-agent.json` | Removed Northstar-specific GDPR/Joi/rate-limit hardcodes from checklist; checklist is now generic; reads security requirements from project config |
| `.kiro/agents/documentation-agent.json` | Removed hardcoded Northstar documentation file list from instructions; reads from project config §8; documentation standards made generic |
| `.kiro/hooks/sdlc-phase-observer.json` | Removed Northstar-specific keywords (econnrefused, supertest, jest); now generic engineering lifecycle observer |
| `KIRO-AGENT-POC-REPORT.md` | This file — replaces v1.0 POC report with full framework documentation |

### Retained (Unchanged)

| File | Reason |
|---|---|
| `.kiro/steering/HNTL.md` | Existing framework; referenced by Design Agent and Router; no changes needed |
| `.kiro/steering/Requirement_docs/Northstar_Product_Requirements_Document.md` | Source of truth for requirements; no changes needed |
| All `backend/src/**` | Application source code — not touched |
| All `backend/tests/**` | Test files — not touched |
| All `*.md` documentation files | Project documentation — not touched |

---

## 7. Routing Table

### Phase → Routing Category → Agent → Model

| Input Phase (any lifecycle) | Normalized Category | Agent | Model ID | Model Name |
|---|---|---|---|---|
| Inception, Discovery, Gap Analysis, PRD, User Story | REQUIREMENT | Design Agent | claude-sonnet-4-5 | Claude Sonnet 4.5 |
| Architecture, Technical Design, API Design, DB Design | DESIGN | Design Agent | claude-sonnet-4-5 | Claude Sonnet 4.5 |
| Implement, Develop, Refactor, Build, Add Endpoint | DEVELOPMENT | Development Agent | claude-sonnet-4 | Claude Sonnet 4 |
| Test Cases, QA, Automation, Regression, Coverage | TESTING | QA Agent | claude-haiku-4-5 | Claude Haiku 4.5 |
| Failure, Debug, Root Cause, Stack Trace, Broken | DEBUGGING | Debugging Agent | claude-sonnet-4 | Claude Sonnet 4 |
| Code Review, Security Audit, Performance Review | CODE_REVIEW | Code Review Agent | claude-sonnet-4-5 | Claude Sonnet 4.5 |
| Documentation, README, Release Notes, Docs Update | DOCUMENTATION | Documentation Agent | minimax-m21 | MiniMax M2.1 |
| Deploy, Release, Launch | RELEASE | Dev Agent (infra) / Docs Agent (notes) | per category | per category |

---

## 8. Model Override Priority

```
PROJECT OVERRIDE (framework-project-config.md §12)
        ↓
GLOBAL POLICY (framework-model-policy.md)
        ↓
KIRO DEFAULT (automatic fallback if model unavailable)
```

To override a model for one project only: edit `framework-project-config.md` §12.
To change the global default: edit `framework-model-policy.md` and the corresponding agent's `"model"` field.

---

## 9. How to Reuse This Framework on Another Project

Only ONE file needs to change: `framework-project-config.md`

Replace the following sections:

| Section | What to Replace |
|---|---|
| §1 Project Identity | Project name, type, lifecycle, repository |
| §2 Technology Stack | Backend/frontend tech, runtime, database, port |
| §3 Source Structure | Directory layout |
| §4 Database Schema | Tables and fields |
| §5 API Endpoints | All endpoints |
| §6 Testing Framework | Framework name, commands, existing test files |
| §7 Coding Conventions | Language, module system, utilities, response format |
| §8 Documentation Files | Existing docs |
| §9 Known Issues | Project-specific failure patterns |
| §10 Phase State | Current lifecycle position |
| §11 Design Artifacts | Existing spec files |
| §12 Model Overrides | Any project-specific model substitutions |
| §13 Terminology Mapping | Lifecycle term → framework routing category |

The following do NOT need to change:
- router-agent.json
- All 6 specialist agents
- framework-model-policy.md (unless changing global defaults)
- sdlc-phase-observer.json hook
- HNTL.md steering file

---

## 10. Reusability Check — Portability Test

**Question: Could this framework be copied to a different project?**

**Answer: YES.**

| Component | Reusable Without Changes |
|---|---|
| Northstar Router | ✅ Reads project config from steering |
| Design Agent | ✅ No project-specific logic |
| Development Agent | ✅ No project-specific logic |
| QA Agent | ✅ No project-specific logic |
| Debugging Agent | ✅ No project-specific logic |
| Code Review Agent | ✅ No project-specific logic |
| Documentation Agent | ✅ No project-specific logic |
| framework-model-policy.md | ✅ Generic model assignments |
| sdlc-phase-observer.json | ✅ Generic phase detection keywords |
| framework-project-config.md | ❌ Replace with target project's config |

**Steps to deploy to a new project:**
1. Copy `.kiro/` directory to new project
2. Replace `.kiro/steering/framework-project-config.md` with new project's configuration
3. Optionally update §12 of that file for any project-specific model overrides
4. Done — all agents and the router are immediately operational

---

## 11. Demonstration Sequence

Start by invoking `@Northstar Router` for every task. No model selection required.

**STEP 1 — Requirements**
```
@Northstar Router Analyze this requirement and define acceptance criteria for the frontend search feature.
```
Expected output:
```
Lifecycle        : AIDLC
Detected Phase   : REQUIREMENT
Routing Category : REQUIREMENT
Selected Agent   : Design Agent
Selected Model   : Claude Sonnet 4.5
Confidence       : HIGH
```

**STEP 2 — Design**
```
@Northstar Router Create the technical design for the React search component including API integration pattern.
```
Expected output:
```
Detected Phase   : DESIGN
Selected Agent   : Design Agent
Selected Model   : Claude Sonnet 4.5
```

**STEP 3 — Implementation**
```
@Northstar Router Implement the approved search component using the React/Vite stack.
```
Expected output:
```
Detected Phase   : DEVELOPMENT
Selected Agent   : Development Agent
Selected Model   : Claude Sonnet 4
```

**STEP 4 — Testing**
```
@Northstar Router Create test cases and write unit tests for the search component using the existing Jest setup.
```
Expected output:
```
Detected Phase   : TESTING
Selected Agent   : QA Agent
Selected Model   : Claude Haiku 4.5
```

**STEP 5 — Debugging**
```
@Northstar Router Investigate why the search integration test is failing with a 404.
```
Expected output:
```
Detected Phase   : DEBUGGING
Selected Agent   : Debugging Agent
Selected Model   : Claude Sonnet 4
```

**STEP 6 — Code Review**
```
@Northstar Router Review the search implementation for security and performance issues.
```
Expected output:
```
Detected Phase   : CODE_REVIEW
Selected Agent   : Code Review Agent
Selected Model   : Claude Sonnet 4.5
```

**STEP 7 — Documentation**
```
@Northstar Router Update the API documentation with the search endpoint changes.
```
Expected output:
```
Detected Phase   : DOCUMENTATION
Selected Agent   : Documentation Agent
Selected Model   : MiniMax M2.1
```

In all 7 steps you typed `@Northstar Router`. Zero manual model switching.

---

## 12. Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| `@Northstar Router` must be invoked explicitly | Minor — one consistent habit per task | Make it the default agent selection |
| Phase detection is keyword/intent-based | Medium — complex prompts may misroute | Router asks clarifying question on LOW confidence |
| Sub-agent execution is sequential | Low | Acceptable for single-task requests |
| Model availability depends on Kiro plan | Medium — silent fallback if unavailable | Run `/model` to verify; update agent files if needed |
| Observer hook is informational only | None — by design | Use router for actual routing |
| No persistent session-level phase state | Low — each message re-analysed | Phase context re-derived from message content |
| framework-project-config.md must be kept current | Medium — stale config gives wrong context | Update §10 as project phases complete |

---

## 13. Kiro Capability Summary (Confirmed)

| Capability | Supported |
|---|---|
| Custom agents with per-agent model | ✅ |
| Agent reads steering files automatically | ✅ (inclusion: always) |
| Sub-agent delegation from router | ✅ (subagent tool) |
| UserPromptSubmit hook for observability | ✅ |
| Native automatic routing by prompt content | ❌ — router pattern is the workaround |
| Hook-based agent switching | ❌ — hooks inject context only |

---

*No application source code was modified. No existing steering files were modified. HNTL.md and Northstar_Product_Requirements_Document.md are unchanged.*
