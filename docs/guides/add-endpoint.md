# Guide: Add Endpoint

Last reviewed: 2026-02-26

## Purpose

Legge til nytt HTTP-endpoint med riktig lagdeling og docs-sync.

## Steps

1. Finn oppgavetype i `docs/reference/skill-routing-matrix.md`
2. Les alle MUST-skills for valgt oppgavetype
3. Skriv `Relevant skills` i Compliance Summary før implementasjon
4. Skriv test først (RED)
5. Implementer minimal løsning (GREEN)
6. Refaktorer trygt
7. Oppdater API-docs og relevante policies
8. Kjør `npm run check`

## Endpoint-typer og obligatoriske skills

- Generelt endpoint:
  - MUST: `ai-agent-doc-compliance.skill.md`, `api-contracts-and-versioning.skill.md`, `test-drevet-utvikling.skill.md`
- Endpoint med auth/authz/ownership:
  - MUST: alle over + `authorization-and-access-control.skill.md`
  - MUST: oppdater `docs/reference/access-control.md` ved nye actions/rollepåvirkning
- Endpoint som endrer persistensmodell/schema:
  - MUST: alle relevante over + `data-modeling-persistence.skill.md` og `database-and-migrations.skill.md`

## Hard stop

Stopp og avklar før kode hvis:

- `Relevant skills` ikke kan spores til en rad i `docs/reference/skill-routing-matrix.md`
- endpointtype er uklar (authz/persistens/kontrakt) og derfor gir tvetydig skillvalg
- action/rolle-endring mangler samtidig oppdatering i `docs/reference/access-control.md`

## Checklist

- [ ] Request/response dokumentert
- [ ] Feilstatuskoder dokumentert
- [ ] `Relevant skills` er mappet til rad i `docs/reference/skill-routing-matrix.md`
- [ ] `docs/reference/access-control.md` er oppdatert ved authz/action/rolle-endringer
- [ ] Docs-impact beskrevet i PR
