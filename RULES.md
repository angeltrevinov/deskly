# Project Rules and Requirements

## Purpose
Single source of truth to track active project rules, why they exist, and when they changed.

## Scope
These rules apply to project work, especially decisions supported by LLMs.

## Active Rules

### [R-001] Document every relevant LLM-assisted decision
- Requirement: Every relevant decision must be documented in [DECISIONS.md](DECISIONS.md) using the required format.
- Why: Evaluation focuses on human reasoning, not only generated code.
- Status: active
- Since: 2026-07-28

### [R-002] Always capture the why before closing a relevant decision
- Requirement: Before closing a relevant decision, explicitly state why the decision was made.
- Why: Keeps decision criteria defensible and auditable.
- Status: active
- Since: 2026-07-28

### [R-003] Decision coverage
- Requirement: Apply this process to all relevant architecture, implementation, and testing decisions.
- Why: Balanced traceability without overloading trivial edits.
- Status: active
- Since: 2026-07-28

### [R-004] Honesty over invented justification
- Requirement: If a suggestion was accepted without full understanding, declare it.
- Why: Honest gaps are better than fabricated confidence.
- Status: active
- Since: 2026-07-28

### [R-005] Defensibility standard
- Requirement: Any important code line should be explainable by the author in follow-up review/interview.
- Why: Inability to explain choices is a larger risk than incomplete functionality.
- Status: active
- Since: 2026-07-28

## Rule Change Log

### 2026-07-29
- Added initial rule registry file and baseline rules R-001 to R-005.
- Added LLM-consumable convention files: `.github/copilot-instructions.md` and `.github/skills/decision-tracking/SKILL.md`.
- Migrated decision log language and filename from `DECISIONES.md` to `DECISIONS.md`.

## How to add a new rule
Copy this block:

### [R-XXX] Short rule title
- Requirement:
- Why:
- Status: active | deprecated | replaced
- Since: YYYY-MM-DD
- Replaces: R-XXX (optional)
- Notes:

## Related Files
- [DECISIONS.md](DECISIONS.md)
- [.github/copilot-instructions.md](.github/copilot-instructions.md)
- [.github/skills/decision-tracking/SKILL.md](.github/skills/decision-tracking/SKILL.md)
