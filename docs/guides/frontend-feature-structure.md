# Frontend Feature Structure Guide

Last reviewed: 2026-02-28

Kort guide for hvordan frontend-kode i `Frontend/admin/src` organiseres i dette prosjektet.

## Formål

- Holde React-kode lesbar og lett å endre
- Redusere store "god components"
- Gjøre ansvar tydelig per fil
- Sikre at nye PR-er følger eksisterende clean-code/frontend-skills

## Målstruktur (MVP)

```text
Frontend/admin/src/
  App.tsx
  api-client.ts
  main.tsx
  features/
    auth/
    pages/
    layout/
    common/
```

## Ansvar per mappe

- `features/auth/`
  - Login/logout-relaterte views og controllers for auth-flyt
  - Eksempel: `LoginPage.tsx`

- `features/pages/`
  - Page-list, page-editor, preview og relaterte presentasjonskomponenter
  - Eksempler: `PagesListPage.tsx`, `EditPage.tsx`, `NewPage.tsx`, `PreviewRoute.tsx`, `PageEditorFields.tsx`

- `features/layout/`
  - App-shell, route-heading og route guards
  - Eksempler: `AppLayout.tsx`, `RouteHeading.tsx`, `ProtectedRoute.tsx`

- `features/common/`
  - Delte UI-nære utilities og typer (ikke global "junk drawer")
  - Eksempler: `types.ts`, `errors.ts`, `validation.ts`, `toast.ts`, `ui/Button.tsx`, `ui/FormField.tsx`

## Regler (MUST)

- `App.tsx` skal være route-komposisjon/orchestrator, ikke inneholde stor featurelogikk.
- Nye komponenter skal ha ett tydelig ansvar.
- Delte typer og helper-funksjoner legges i `features/common/` når de brukes på tvers av features.
- API-kall skal gå via `api-client.ts`, ikke spres direkte i tilfeldige presentasjonskomponenter.
- Ny frontend-kode skrives i TypeScript (`.ts`/`.tsx`).

## Regler (SHOULD)

- Hold filstørrelse moderat; ved voksende komponenter splitt i container/presentational der det gir lavere kognitiv last.
- Hold props-overflate kontrollert; vurder `viewModel/actions`-mønster ved brede komponent-API.
- Legg test nær feature der det er naturlig.

## Ikke gjør dette

- Ikke legg nye store features direkte inn i `App.tsx`.
- Ikke opprett generiske `utils`-mapper uten feature-eierskap.
- Ikke bland auth-, layout- og page-ansvar i samme komponentfil.

## Sjekkliste før PR

1. Har ny kode riktig feature-hjem (`auth/pages/layout/common`)?
2. Er komponentansvar tydelig og smalt?
3. Er all ny kode TypeScript?
4. Er API-bruk kapslet via `api-client.ts`?
5. Er `npm run frontend:check` grønn?

## Relaterte normative docs

- `docs/skills/clean-code.skill.md`
- `docs/skills/frontend-architecture-and-code-quality-react-next.skill.md`
- `docs/skills/frontend-container-composition-and-props.skill.md`
- `docs/frontend-cms-mvp-spec.md`
