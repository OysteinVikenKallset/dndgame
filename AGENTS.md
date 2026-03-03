# AGENTS.md

This file defines mandatory startup behavior for coding agents in this repository.

## Always read first (in order)

1. docs/README.md
2. docs/skills/ai-agent-doc-compliance.skill.md
3. docs/reference/skill-routing-matrix.md
4. Relevant docs in docs/skills/, specs, ADRs, and runbooks for the task

## Mandatory rules

- Do not edit code before the required docs are read.
- If docs conflict or are unclear, stop and ask for clarification.
- Keep changes minimal and aligned with project skills.
- Include a Compliance Summary in substantial handoffs.

## Enforcement

- Code changes must include docs updates.
- Code changes must include an update to docs/agent-memory.md.
- These rules are enforced by scripts/docs-guard.mjs in pre-commit and CI.
