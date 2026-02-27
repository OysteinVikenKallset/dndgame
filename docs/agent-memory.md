# Agent Memory

Dette dokumentet er en kort, levende status for AI-agenter.

## Nåværende status

- TypeScript + Vitest er etablert med streng konfigurasjon
- Clean Architecture-struktur er i bruk (`domain/application/infrastructure/interface`)
- Auth-endepunkter for register/login/logout/me er implementert med TDD
- `PATCH /api/users/me` er implementert med allowlist (`displayName`, `avatarUrl`) og negative tester
- Rate limiting er implementert på `POST /api/auth/register` og `POST /api/auth/login` (`429`, 5 forsøk per 10 min, nøkkel `ip+email`)
- Session-basert auth er aktiv med server-side session store og cookie `sessionId`
- Kvalitetsguardrails er operative (lint, test, build, PR-sjekkliste)
- AI runtime-governance er operativ med global compliance-skill, hard stop/escalation, verification hierarchy og fast `Compliance Summary`
- Coverage policy håndheves på 100% og er grønn
- Docs-system er operasjonalisert med skills, decision tree, agents/reference/guides/runbooks

## Siste beslutninger

- TypeScript kjøres med strenge regler
- `skipLibCheck` er satt til `false`
- ADR: [0001-strict-typescript-og-vitest](docs/adr/0001-strict-typescript-og-vitest.md)
- Skills følger nå filnavnkonvensjonen `*.skill.md` i `docs/skills/`
- `project-documentation-system.skill.md` er source of truth for docs-regler
- PR-er skal oppdatere relevante docs i samme endring (eller begrunne hvorfor docs er uendret)

## Neste foreslåtte steg

- Implementere og dokumentere eksplisitt CSRF-strategi for cookie-basert auth (vurder ADR)
- Legge til kort guide for AI PR-workflow i `docs/guides/` (fra oppgave til `Compliance Summary`)

## Arbeidsregler for agenter

- Oppdater denne filen etter større endringer
- Skriv kortfattet hva som er gjort, hvorfor, og hva som er neste
- Referer til ADR ved arkitekturelle beslutninger
