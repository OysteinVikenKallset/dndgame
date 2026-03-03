# Architecture

Last reviewed: 2026-02-28

## Prinsipp

Hold domenelogikk uavhengig av IO (filer, nettverk, database).

## Struktur i repoet

- `Backend/src/domain/`: Regler, modeller og spilllogikk
- `Backend/src/application/`: Use-cases / orkestrering
- `Backend/src/infrastructure/`: Integrasjoner (database, API, filer)
- `Backend/src/interface/`: HTTP-controllere, request/response-mapping
- `Backend/src/server.ts`: HTTP-komposisjon og ruting
- `Backend/src/index.ts`: Enkle entrypoints/hjelpefunksjoner
- `Frontend/admin/src/features/`: Frontend feature-moduler (auth/pages/layout/common)
- `Frontend/admin/src/App.tsx`: Route-komposisjon for frontend
- `Frontend/admin/src/api-client.ts`: API-klient og DTO-typer for frontend

## Regler

- En modul skal ha ett tydelig ansvar
- Ren logikk i `domain`, sideeffekter i `infrastructure`
- Avhengigheter skal peke innover (mot domain), ikke utover
- Frontend-routes orkestrerer feature-komponenter; presentasjon og featurelogikk splittes i egne moduler

## Operativ håndheving

- Import-retning håndheves av ESLint-regler (dependency rule)
- Kvalitetsgates kjøres via `npm run check` (lint -> test -> build)
- Coverage-threshold håndheves i CI/lokalt

## Dataflyt (høynivå)

HTTP request -> interface -> application -> domain -> application -> interface -> HTTP response
