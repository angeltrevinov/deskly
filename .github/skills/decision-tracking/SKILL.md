---
name: decision-tracking
user-invocable: false
description: "Use when creating, updating, or reviewing project decisions and LLM rationale records. Triggers: decision log, DECISIONS.md, why justification, rationale, accept/modify/discard, alternatives discarded, rule compliance."
---

# Decision Tracking Skill

## Goal
Keep clear traceability for relevant decisions and human judgment over LLM outputs.

## Mandatory rules
- Record every relevant decision in [DECISIONS.md](../../../DECISIONS.md).
- Do not close relevant decisions without explicitly recording the why.
- Declare when a suggestion was accepted without full understanding.
- Apply to architecture, implementation, and testing decisions (not trivial changes).

## Required output format
Use this format for each new decision:

###[Decision] Short title
**Context:** what problem was being solved.
**LLM usage:** what was asked and why (or "without LLM").
**Model output:** summary of what it proposed.
**My decision:** what I accepted, modified, or discarded, and by what criteria.
**Rejected alternative:** what it was and why it was rejected.

## Workflow
1. Identify whether the decision is relevant.
2. Ask for and capture the why before closing.
3. Record content using the required format.
4. Verify consistency with [RULES.md](../../../RULES.md).
