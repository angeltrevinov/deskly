# Deskly LLM Rules

These instructions apply to the entire workspace.

## Decision policy (mandatory)
- Every relevant decision must be recorded in [DECISIONS.md](../DECISIONS.md).
- Before closing a relevant decision, explicitly ask for and record the why.
- If an LLM suggestion is accepted without full understanding, state it explicitly.
- Coverage: architecture, implementation, and testing decisions. Exclude trivial changes.

## Required decision format
Use this exact format for new entries in [DECISIONS.md](../DECISIONS.md):

###[Decision] Short title
**Context:** what problem was being solved.
**LLM usage:** what was asked and why (or "without LLM").
**Model output:** summary of what it proposed.
**My decision:** what I accepted, modified, or discarded, and by what criteria.
**Rejected alternative:** what it was and why it was rejected.

## Rule source
- Versioned rules: [RULES.md](../RULES.md)
- Decision history log: [DECISIONS.md](../DECISIONS.md)
