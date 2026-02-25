# Architecture

Last reviewed: 2026-02-25

## Prinsipp

Hold domenelogikk uavhengig av IO (filer, nettverk, database).

## Struktur i repoet

- `src/domain/`: Regler, modeller og spilllogikk
- `src/application/`: Use-cases / orkestrering
- `src/infrastructure/`: Integrasjoner (database, API, filer)
- `src/interface/`: HTTP-controllere, request/response-mapping
- `src/server.ts`: HTTP-komposisjon og ruting
- `src/index.ts`: Enkle entrypoints/hjelpefunksjoner

## Regler

- En modul skal ha ett tydelig ansvar
- Ren logikk i `domain`, sideeffekter i `infrastructure`
- Avhengigheter skal peke innover (mot domain), ikke utover

## Operativ håndheving

- Import-retning håndheves av ESLint-regler (dependency rule)
- Kvalitetsgates kjøres via `npm run check` (lint -> test -> build)
- Coverage-threshold håndheves i CI/lokalt

## Dataflyt (høynivå)

HTTP request -> interface -> application -> domain -> application -> interface -> HTTP response
