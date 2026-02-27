# Team Conventions

## Mapper per lag

- `src/domain/`: entiteter, value objects, domene-regler
- `src/application/`: use-cases og porter
- `src/infrastructure/`: DB/API/filsystem/integrasjoner
- `src/interface/`: HTTP-ruter, controllere, UI-mapping

## Navngiving

- Domain objekter: substantiv (`Order`, `Character`, `Campaign`)
- Use-cases: verb + mål (`loginUser`, `createCharacter`)
- Porter: rollebasert navn (`UserRepository`, `TokenService`)
- Unngå vage navn (`Manager`, generell `Service`, `util`, `helper`)

## Feilmønster (valgt standard)

- Bruk `throw` med tydelige domene-/applikasjonsfeil
- Vær konsistent per lag
- Ikke swallow errors
- Ikke returner `null` når feiltilstand bør være eksplisitt

## DTO-konvensjon

- DTO-er brukes kun i `interface`/`infrastructure`
- Domain-modeller skal ikke lekke direkte ut i API-respons
- Mapping skjer ved laggrensene

## Lagregler

- `domain` importerer ikke `application`, `infrastructure` eller `interface`
- `application` kan importere `domain`
- `infrastructure` kan importere `application`/`domain`
- `interface` kan importere `application` (og helst ikke `domain` direkte)

## Endringsstørrelse

- Foretrekk små PR-er
- Én tydelig hensikt per endring
- Unngå skjult feature-utvikling under refaktorering

## Dokumentasjonsregel

- Ved kodeendringer skal relevante docs oppdateres i samme endring
- Hvis docs ikke endres, skal PR beskrive hvorfor ingen docs var berørt
- Arkitekturvalg eller varige tekniske beslutninger dokumenteres i ADR
