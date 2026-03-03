# Project Map

Last reviewed: 2026-02-25

## Purpose

Gi rask oversikt over hvor ting ligger i prosjektet.

## Source map

- `Backend/src/domain/`: domeneobjekter og regler
- `Backend/src/application/`: use-cases og porter
- `Backend/src/infrastructure/`: adaptere (DB/hash/token/IO)
- `Backend/src/interface/`: HTTP-controller/mapping
- `Frontend/admin/src/`: admin-frontend for CMS (React + Vite)
- `Frontend/website/src/`: separat website-testklient (Next.js)

## Documentation map

- `docs/README.md`: entrypoint + decision tree
- `docs/skills/`: normative regler
- `docs/reference/`: begreper, mapping, kontraktreferanser
- `docs/guides/`: how-to
- `docs/decisions/`: beslutningsindeks (ADR)
- `docs/runbooks/`: feilsøking/operasjon
- `docs/agents/`: AI-kontrakter og checklister

## Governance map

- `docs/engineering-os-v1.md`: beslutningsregler og operative guardrails
- `docs/skills/ai-agent-doc-compliance.skill.md`: global AI runtime-governance
- `docs/ai-work-instructions.md`: AI-sjekkliste + leveranseformat
- `docs/agents/checklist.md`: agentens før/under/etter-sjekkliste
- `docs/agents/constitution.md`: agentkontrakt og stop conditions
- `.github/pull_request_template.md`: PR-gate med fast `Compliance Summary`

## Related docs

- `docs/architecture.md`
- `docs/team-conventions.md`
- `docs/skills/clean-architecture.skill.md`
- `docs/reference/design-patterns.md`
- `docs/reference/object-oriented-programming.md`
