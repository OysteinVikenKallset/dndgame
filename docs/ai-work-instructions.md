# AI Work Instructions

Denne sjekklisten brukes av AI-agenter før de leverer en endring.

## Obligatoriske spørsmål per PR

- Hva endret jeg?
- Hvilken rad i `docs/reference/skill-routing-matrix.md` dekker denne oppgaven?
- Hvilket lag berører dette (`domain`/`application`/`infrastructure`/`interface`)?
- Er ny atferd skrevet test-først?
- Brøt jeg dependency rule?
- La jeg til abstraksjon? Hvorfor er den nødvendig nå?
- Hvilke docs ble oppdatert, eller hvorfor var docs uendret?
- Hva er risikoen med endringen?

## Leveransekrav

- Endringen er liten, konkret og verifiserbar
- Lint/test/build er grønne
- Ingen lagbrudd i imports
- Ingen overengineering uten dokumentert behov
- Relevante docs er oppdatert i samme PR (inkl. ADR ved behov)
- Docs-regler verifiseres automatisk via `npm run docs:guard` (pre-commit) og `npm run docs:guard:ci` (CI)

## Fast leveranseformat (Compliance Summary)

Agenten skal inkludere dette formatet i leveransen:

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

## Hard stop for AI

Agenten skal stoppe og korrigere hvis:

- implementasjon skjer før test ved ny atferd
- indre lag importerer ytre lag
- endringen blir større enn nødvendig uten god grunn
- kode er endret uten å oppdatere relevante docs eller begrunne hvorfor docs er uendret
