# Skill Routing Matrix

Last reviewed: 2026-02-26

## Formål

Sikre at riktig skill brukes til riktig oppgavetype, med tydelige MUST-krav.

## Bruksregel

1. Finn oppgavetype i matrisen.
2. Les alle skills i `MUST` før implementasjon.
3. Les `SHOULD` ved usikkerhet, høy risiko eller grensekryssende endring.
4. Hvis en endring matcher flere rader, gjelder union av alle `MUST`-skills.

## Routing-matrise

| Oppgavetype                       | Trigger / eksempel                               | MUST skills                                                                                                   | SHOULD skills                                                                 |
| --------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Endre auth/autentisering          | login/logout/register/session                    | `ai-agent-doc-compliance.skill.md`, `user-auth-api.skill.md`, `authorization-and-access-control.skill.md`     | `api-contracts-and-versioning.skill.md`, `test-drevet-utvikling.skill.md`     |
| Legge til/endre HTTP-endpoint     | ny route, ny request/response, statuskodeendring | `ai-agent-doc-compliance.skill.md`, `api-contracts-and-versioning.skill.md`, `test-drevet-utvikling.skill.md` | `authorization-and-access-control.skill.md`, `clean-architecture.skill.md`    |
| Endre tilgangsregler              | roller, ownership, policy, audit                 | `ai-agent-doc-compliance.skill.md`, `authorization-and-access-control.skill.md`                               | `api-contracts-and-versioning.skill.md`, `data-modeling-persistence.skill.md` |
| Modellere data / endre persistens | entiteter, constraints, repository-kontrakter    | `ai-agent-doc-compliance.skill.md`, `data-modeling-persistence.skill.md`, `database-and-migrations.skill.md`  | `clean-architecture.skill.md`, `test-drevet-utvikling.skill.md`               |
| Endre schema/migrasjoner          | nye tabeller/felt, rollback/forward-only         | `ai-agent-doc-compliance.skill.md`, `database-and-migrations.skill.md`                                        | `data-modeling-persistence.skill.md`, `test-drevet-utvikling.skill.md`        |
| Refaktorering uten ny atferd      | struktur/navn/ansvarsdeling                      | `ai-agent-doc-compliance.skill.md`, `clean-code.skill.md`, `clean-architecture.skill.md`                      | `object-oriented-programming.skill.md`, `design-patterns.skill.md`            |
| Ny business-regel i domain        | invariants, valideringsregler som alltid gjelder | `ai-agent-doc-compliance.skill.md`, `clean-architecture.skill.md`, `test-drevet-utvikling.skill.md`           | `clean-code.skill.md`, `object-oriented-programming.skill.md`                 |
| Endre docs/governance             | nye skills, policyendring, arbeidsprosess        | `ai-agent-doc-compliance.skill.md`, `project-documentation-system.skill.md`                                   | `clean-architecture.skill.md`                                                 |

## Prioritetsregler ved konflikt

- Sikkerhet trumfer bekvemmelighet: `authorization-and-access-control.skill.md` og `user-auth-api.skill.md` prioriteres over generelle kode-regler.
- Kontrakt trumfer implementasjonsdetalj: `api-contracts-and-versioning.skill.md` prioriteres ved API-inkonsistens.
- Dataintegritet trumfer hastighet: `data-modeling-persistence.skill.md` og `database-and-migrations.skill.md` prioriteres ved persistensvalg.

## Hard stop

Stopp og avklar før implementasjon hvis:

- oppgaven ikke kan mappes til en rad i matrisen
- to MUST-krav peker i motstridende retning uten avklart prioritet
- `Relevant skills` i PR ikke kan spores til minst én rad i matrisen
