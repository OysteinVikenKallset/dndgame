# Docs

Denne mappen er prosjektets "persistent minne" for både mennesker og AI-agenter.

All normative project rules live in `docs/skills/`.
Any implementation must follow relevant skills.

## Mål

- Gi rask prosjektforståelse
- Dokumentere tekniske beslutninger
- Samle kodestandarder
- Gjøre onboarding enklere

## Start here

1. Les `docs/00-quickstart.md`
2. Finn oppgavetype i `docs/reference/skill-routing-matrix.md`
3. Kryssjekk med beslutningstreet under
4. Les `docs/skills/ai-agent-doc-compliance.skill.md` (gjelder alltid for AI)
5. Les relevante skills før implementasjon
6. Bruk PR-malens `Compliance Summary` i `.github/pull_request_template.md`

## Beslutningstre

- Hvis du skal endre auth eller brukerflyt:
  - Les `docs/skills/user-auth-api.skill.md`
  - Les `docs/skills/authorization-and-access-control.skill.md`
  - Les `docs/user-auth-api-mvp-spec.md`
  - Les `docs/skills/project-documentation-system.skill.md`
- Hvis du skal legge til/endre endpoint:
  - Les `docs/reference/skill-routing-matrix.md`
  - Les `docs/user-auth-api-mvp-spec.md`
  - Les `docs/skills/api-contracts-and-versioning.skill.md`
  - Les `docs/skills/authorization-and-access-control.skill.md` ved authz/ownership/sensitiv ressurs
  - Les `docs/testing-strategy.md`
  - Les `docs/skills/test-drevet-utvikling.skill.md`
- Hvis du skal refaktorere kode:
  - Les `docs/skills/clean-code.skill.md`
  - Les `docs/skills/clean-architecture.skill.md`
  - Les `docs/skills/object-oriented-programming.skill.md`
  - Les `docs/reference/object-oriented-programming.md`
  - Les `docs/skills/design-patterns.skill.md`
  - Les `docs/reference/design-patterns.md`
- Hvis du skal bygge/endre frontend med React/Next:
  - Les `docs/reference/skill-routing-matrix.md`
  - Les `docs/skills/frontend-architecture-and-code-quality-react-next.skill.md`
  - Les `docs/skills/clean-code.skill.md`
  - Les `docs/skills/api-contracts-and-versioning.skill.md`
  - Les `docs/skills/authorization-and-access-control.skill.md` ved authz-styrte UI-handlinger
- Hvis du skal modellere data eller endre persistens:
  - Les `docs/reference/skill-routing-matrix.md`
  - Les `docs/skills/data-modeling-persistence.skill.md`
  - Les `docs/skills/database-and-migrations.skill.md`
  - Les `docs/skills/clean-architecture.skill.md`
  - Les `docs/testing-strategy.md`
- Hvis du skal endre arbeidsprosess/regler:
  - Les `docs/engineering-os-v1.md`
  - Les `docs/team-conventions.md`
  - Les `docs/skills/project-documentation-system.skill.md`

## Governance Map (runtime)

Kjernedokumenter for operativ styring av mennesker + AI:

- `docs/engineering-os-v1.md`: Operativ arbeidsflyt og beslutningsregler
- `docs/skills/ai-agent-doc-compliance.skill.md`: Global AI-governance
- `docs/ai-work-instructions.md`: Operativ AI-sjekkliste per leveranse
- `docs/agents/checklist.md`: Agent-sjekkliste før implementasjon/levering
- `docs/agents/constitution.md`: Agentkontrakt og stop conditions
- `.github/pull_request_template.md`: PR-gate med fast `Compliance Summary`
- `npm run docs:guard` / `npm run docs:guard:ci`: automatisk håndheving av docs-oppdatering ved kodeendring
- `docs/guides/docs-guard-failures.md`: feilsøking når docs-guard blokkerer commit/CI

## Struktur

- `00-quickstart.md`: Hurtig oppstart for utviklere og AI-agenter
- `project-overview.md`: Hva prosjektet er, mål, scope og stack
- `architecture.md`: Hovedarkitektur, moduler og dataflyt
- `coding-principles.md`: Konkrete koderegler og kvalitetskrav
- `agent-memory.md`: Levende status for AI-agenter (hva er gjort, hva er neste)
- `adr/`: Architecture Decision Records (viktige beslutninger)
- `decisions/`: Beslutningsindeks og peker til ADR
- `reference/`: Glossary, project map og kontraktreferanser
- `reference/skill-routing-matrix.md`: Oppgavetype -> obligatoriske skills (MUST/SHOULD)
- `reference/access-control.md`: Policy-matrise (roller x actions) for authz
- `guides/`: Task-first steg-for-steg guider
- `runbooks/`: Feilsøking og operasjonelle playbooks
- `agents/`: Agentkontrakt og agentchecklist
- `skills/`: Praktiske ferdigheter og arbeidsmåter for agenter og utviklere
- `skills/clean-code.skill.md`: Operativ clean-code standard for utviklere og AI-agenter
- `skills/object-oriented-programming.skill.md`: Operativ veiledning for pragmatisk bruk av OOP
- `skills/design-patterns.skill.md`: Operativ veiledning for når/hvordan design patterns brukes
- `skills/user-auth-api.skill.md`: Operativ standard for sikkert bruker- og autentiserings-API
- `skills/api-contracts-and-versioning.skill.md`: Operativ standard for DTO-er, feilformat, versjonering og contract tests
- `skills/authorization-and-access-control.skill.md`: Operativ standard for roller, ownership, policy-regler og audit trail
- `skills/data-modeling-persistence.skill.md`: Operativ standard for datamodellering, constraints, migrasjoner og mapping
- `skills/database-and-migrations.skill.md`: Operativ standard for migrasjoner, seed-policy, test-DB-strategi og backup/restore light
- `skills/frontend-architecture-and-code-quality-react-next.skill.md`: Operativ standard for frontend-arkitektur, komponentansvar, state/datahenting og testbar React/Next-kode
- `skills/project-documentation-system.skill.md`: Operativ docs-standard og håndhevingsregler
- `user-auth-api-mvp-spec.md`: Konkret endpoint-kontrakt for første versjon av bruker/auth-API
- `engineering-os-v1.md`: Operativ kortversjon med beslutningstre og sjekklister
- `team-conventions.md`: Konvensjoner for lag, navn, DTO og feilhåndtering
- `testing-strategy.md`: Testpyramide og testansvar per lag
- `ai-work-instructions.md`: Operativ PR-sjekkliste for AI-agenter
- `.github/pull_request_template.md`: PR-mal med fast `Compliance Summary`-format
- `guides/docs-guard-failures.md`: Feilsøkingsguide for docs-guard
- `reference/design-patterns.md`: Katalog over patterns (GoF + pragmatisk bruk)
- `reference/object-oriented-programming.md`: OOP-begreper og pragmatiske eksempler

## Vedlikehold

- Hold filer korte og konkrete
- Oppdater ved hver kodeendring med docs-impact
- Bruk dato på viktige beslutninger og status
