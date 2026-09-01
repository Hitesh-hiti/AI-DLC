---
inclusion: always
---

# Kiro Agent Routing Framework — Global Model Policy

## Purpose

This file defines the **centralized model policy** for the Kiro Agent Routing Framework.
It maps each SDLC routing category to a preferred LLM model.

All specialist agents and the Northstar Router read this policy.
Project-specific overrides are in `framework-project-config.md`.

---

## Model Policy Table

| Routing Category | Preferred Model ID | Model Name | Rationale |
|---|---|---|---|
| REQUIREMENT | claude-sonnet-4-5 | Claude Sonnet 4.5 | High reasoning needed for ambiguous requirement analysis |
| DESIGN | claude-sonnet-4-5 | Claude Sonnet 4.5 | Architecture and API design require deep reasoning |
| DEVELOPMENT | claude-sonnet-4 | Claude Sonnet 4 | Strong code generation, follows instructions precisely |
| TESTING | claude-haiku-4-5 | Claude Haiku 4.5 | Test generation is structured and cost-efficient at scale |
| DEBUGGING | claude-sonnet-4 | Claude Sonnet 4 | Root cause analysis requires multi-file reasoning |
| CODE_REVIEW | claude-sonnet-4-5 | Claude Sonnet 4.5 | Security and architecture review require high accuracy |
| DOCUMENTATION | minimax-m21 | MiniMax M2.1 | Documentation is structured writing — cost-efficient model |

---

## Model Priority Resolution

When selecting a model, apply this priority order:

```
1. PROJECT OVERRIDE     (framework-project-config.md → modelOverrides)
2. GLOBAL POLICY        (this file — table above)
3. KIRO DEFAULT MODEL   (fallback if model ID is unavailable on current plan)
```

---

## Fallback Strategy

If the preferred model is not available on the current Kiro subscription:

- The Northstar Router should note the substitution in the observability header.
- Kiro will automatically fall back to the default model.
- Run `/model` in a Kiro session to verify which model IDs are active.

Example fallback output:
```
Selected Model : Claude Haiku 4.5  [FALLBACK: preferred model unavailable, using Kiro default]
```

---

## Verified Model IDs (Kiro Environment)

The following model IDs are confirmed available in Kiro:

| Model ID | Name |
|---|---|
| claude-sonnet-4-5 | Claude Sonnet 4.5 |
| claude-sonnet-4 | Claude Sonnet 4 |
| claude-haiku-4-5 | Claude Haiku 4.5 |
| minimax-m21 | MiniMax M2.1 |

> To verify availability in your environment, run `/model` in Kiro chat.

---

## Changing the Global Policy

To update the model for a routing category globally:

1. Edit the Model Policy Table above.
2. Update the `"model"` field in the corresponding agent JSON file.
3. No other files need to change.

To override for a single project only, use `framework-project-config.md`.
