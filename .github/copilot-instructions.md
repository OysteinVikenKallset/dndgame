# Copilot Instructions (Repository-wide)

Du skal alltid starte her før du gjør endringer.

## Required pre-read order (MUST)

1. `docs/README.md`
2. `docs/skills/ai-agent-doc-compliance.skill.md`
3. `docs/reference/skill-routing-matrix.md`
4. Relevante skill-filer i `docs/skills/` for oppgaven
5. Relevante specs/runbooks/ADR-er for berørte områder

## Mandatory protocol before code edits

- Identifiser relevante skills og constraints
- Følg pre-execution protocol fra `ai-agent-doc-compliance.skill.md`
- Ved uklarhet/konflikt i docs: hard stop og avklar

## Mandatory output in every substantive response

Bruk formatet:

```text
Compliance Summary:
- Relevant skills:
- Skill-routing rad(er):
- MUST-regler påvirket:
- Antagelser:
- Risiko:
- Docs-impact:
- Verifisering:
```

## Enforcement policy

- Ved kodeendringer MÅ `docs/agent-memory.md` oppdateres i samme endringssett.
- Docs-guard i pre-commit/CI håndhever dette.
- Ikke innfør nye arkitektur-/policy-mønstre uten docs-grunnlag og eventuell ADR-vurdering.
