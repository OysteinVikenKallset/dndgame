## Endringssammendrag

- Hva er endret?
- Hvorfor var endringen nødvendig?

## Docs Impact

- Hvilke docs er oppdatert i denne PR-en?
- Hvis ingen docs er oppdatert: hvorfor er docs uendret?
- Hvis CMS-funksjonalitet er endret: bekreft at `docs/cms-api-mvp-spec.md`, `docs/frontend-cms-mvp-spec.md` og `docs/guides/cms-mvp-implementation-workflow.md` er oppdatert i samme PR.

## Incident Learning (obligatorisk ved feil/feilsøking)

- Oppdaget PR-en en ny feilmodus eller utilstrekkelig dokumentasjon?
- Hvis ja: hvilke runbooks/policies/checklists ble oppdatert i samme PR for å forhindre gjentakelse?

## Compliance Summary

- Relevant skills:
- Skill-routing rad(er):
- MUST-regler påvirket:
- Antagelser:
- Risiko:
- Docs-impact:
- Verifisering:

## TDD Gate (obligatorisk ved ny/endret atferd)

- Hvilken ny test var RED først (testnavn + fil)?
- Hvordan ble RED bekreftet (kort kommando/resultat)?
- Hvilken kontraktskant ble dekket i tillegg til happy path?

## Operativ sjekkliste

- [ ] Hvilket lag berøres (`domain` / `application` / `infrastructure` / `interface`) er beskrevet
- [ ] Ny atferd er testet først (TDD)
- [ ] RED-bevis er dokumentert (testnavn + kort failure-bevis)
- [ ] Kontraktskanter/-detaljer er dekket når endringen påvirker API/DTO/query/validering
- [ ] Ved CMS-funksjonalitet er API-spec (`docs/cms-api-mvp-spec.md`), frontend-spec (`docs/frontend-cms-mvp-spec.md`) og workflow-guide (`docs/guides/cms-mvp-implementation-workflow.md`) oppdatert i samme PR
- [ ] Dependency rule er verifisert (ingen lagbrudd i imports)
- [ ] Eventuell ny abstraksjon er begrunnet
- [ ] Relevante docs er oppdatert (eller tydelig begrunnet hvorfor docs er uendret)
- [ ] Ved ny feilmodus/insight er `Incident Learning` fylt ut og relevante docs oppdatert i samme PR
- [ ] Risiko og rollback-plan er kort beskrevet

## Verifisering

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

## Arkitektur / ADR

- [ ] Endringen krever ADR
- [ ] ADR opprettet/oppdatert (hvis relevant)
