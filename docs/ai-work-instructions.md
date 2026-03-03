# AI Work Instructions

Denne sjekklisten brukes av AI-agenter før de leverer en endring.

## Obligatoriske spørsmål per PR

- Hva endret jeg?
- Hvilken rad i `docs/reference/skill-routing-matrix.md` dekker denne oppgaven?
- Hvilket lag berører dette (`domain`/`application`/`infrastructure`/`interface`)?
- Er ny atferd skrevet test-først?
- Hvilken test var RED først (navn + fil), og hvordan ble feilen bekreftet?
- Hvilken kontraktskant/-detalj ble testet (f.eks. limit-grense, ukjent felt, ugyldig enum)?
- Hvis endringen berører CMS-funksjonalitet: oppdaterte jeg `docs/cms-api-mvp-spec.md`, `docs/frontend-cms-mvp-spec.md` og `docs/guides/cms-mvp-implementation-workflow.md` i samme endringssett?
- Hvis frontend ble endret: er ny atferd dekket av frontend-tester?
- Hvis frontend ble endret: er kode skrevet/validert med TypeScript-policy?
- Brøt jeg dependency rule?
- La jeg til abstraksjon? Hvorfor er den nødvendig nå?
- Hvilke docs ble oppdatert, eller hvorfor var docs uendret?
- Ble det oppdaget en ny feilmodus/insight under feilsøking, og hvilke runbooks/policies ble oppdatert for å hindre gjentakelse?
- Hva er risikoen med endringen?

## Leveransekrav

- Endringen er liten, konkret og verifiserbar
- Lint/test/build er grønne
- RED-bevis for ny atferd er dokumentert i PR/leveranse
- Kontraktskanter er testet når endringen påvirker API/DTO/query/validering
- Ved frontend-endring er også frontend-check grønn (`npm run frontend:check`)
- Ved frontend-endring følger PR også strukturreglene i `docs/guides/frontend-feature-structure.md`:
  - nye filer plasseres i riktig feature-mappe (`auth`/`pages`/`layout`/`common`)
  - side-komponenter holder sideflyt, gjenbrukbar UI flyttes til feature-komponenter
  - nettverkskall går via felles API-klient (ingen `fetch` direkte i sidekomponenter)
  - brukerbeskjeder/feil håndteres deterministisk (ingen `window.alert`)
- Ingen lagbrudd i imports
- Ingen overengineering uten dokumentert behov
- Relevante docs er oppdatert i samme PR (inkl. ADR ved behov)
- Ved CMS-funksjonalitet MUST `docs/cms-api-mvp-spec.md`, `docs/frontend-cms-mvp-spec.md` og `docs/guides/cms-mvp-implementation-workflow.md` oppdateres i samme PR
- Ved oppdaget utilstrekkelig docs/policy MUST relevante runbooks/skills/checklists oppdateres i samme PR
- Ved feil/feilsøking MUST også `Incident Learning`-seksjonen fylles i `.github/pull_request_template.md`
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
- CMS-funksjonalitet er endret uten at API-spec, frontend-spec og workflow-guide er oppdatert
