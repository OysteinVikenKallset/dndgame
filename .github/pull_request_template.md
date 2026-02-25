## Endringssammendrag

- Hva er endret?
- Hvorfor var endringen nødvendig?

## Docs Impact

- Hvilke docs er oppdatert i denne PR-en?
- Hvis ingen docs er oppdatert: hvorfor er docs uendret?

## Compliance Summary

- Relevant skills:
- MUST-regler påvirket:
- Antagelser:
- Risiko:
- Docs-impact:
- Verifisering:

## Operativ sjekkliste

- [ ] Hvilket lag berøres (`domain` / `application` / `infrastructure` / `interface`) er beskrevet
- [ ] Ny atferd er testet først (TDD)
- [ ] Dependency rule er verifisert (ingen lagbrudd i imports)
- [ ] Eventuell ny abstraksjon er begrunnet
- [ ] Relevante docs er oppdatert (eller tydelig begrunnet hvorfor docs er uendret)
- [ ] Risiko og rollback-plan er kort beskrevet

## Verifisering

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

## Arkitektur / ADR

- [ ] Endringen krever ADR
- [ ] ADR opprettet/oppdatert (hvis relevant)
