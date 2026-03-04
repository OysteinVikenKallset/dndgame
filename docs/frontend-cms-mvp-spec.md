# CMS Admin Frontend Specification (React + Vite) — v0.2

Last reviewed: 2026-03-02

Matcher backend-spec: `docs/cms-api-mvp-spec.md` (v0.2).
Ved konflikt om frontend-rammeverk for admin-klienten gjelder denne spesifikasjonen for frontend-MVP (React + Vite).
Designbaseline for admin-UI: `docs/frontend-cms-admin-design-spec.md`.

## 1) Purpose & scope

Bygg en admin-frontend for CMS-et som lar autentiserte brukere:

- logge inn/ut og se «meg»
- oppdatere egen profil (`email`, `displayName`, `role`) fra `My page`
- liste, opprette, redigere, publisere og arkivere pages
- håndtere deterministiske states (`loading`/`error`/`empty`/`ready`)
- følge baseline UU/UX-krav (tastatur, labels, feilmeldinger)

MVP inkluderer ikke:

- full design-system-plattform
- rolle-/brukeradministrasjon i UI (kan komme senere)
- preview-token flow

## 2) Implementation constraints

- Frontend er en separat SPA bygget med React + Vite.
- All backend-kommunikasjon er JSON over HTTP mot backend-endepunkter.
- Auth er cookie-session, så frontend MÅ bruke `credentials: "include"` på alle requests.
- CSRF: state-changing requests MÅ sende CSRF-token iht. backend-policy (se §6).

## 3) UX og navigasjon

### 3.1 Routes (MVP)

- `/login`
- `/` -> redirect til `/pages`
- `/pages` (list)
- `/pages/archived` (archived list/cleanup)
- `/pages/new` (create)
- `/pages/:id` (edit/view)
- `/menu` (header/footer menu config)
- `/settings` (admin actions)
- `/me` (own user profile)
- (valgfritt) `/pages/:id/preview` (preview view i admin)

### 3.2 Global layout

- Toppbar med:
  - `Pages`
  - `Menu`
  - `Settings`
  - `My page`
  - brukermeny med navn/rolle + `Logout`
- Main-område med konsistent page-header pattern (`h1` til venstre, actions til høyre)
- Global toast/status-område (for `Saved`, `Published`, osv.)

### 3.3 Deterministiske UI-tilstander (MUST)

Alle views skal eksplisitt modellere:

- `loading`
- `error`
- `empty` (når relevant)
- `ready`

### 3.4 Auth bootstrap og route guards (MUST)

Appen skal ha auth-bootstrap ved oppstart:

1. kall `GET /api/auth/me`
2. sett session-state til `authenticated` eller `unauthenticated`

Protected routes (`/pages*`) må kreve `authenticated`:

- `unknown` -> vis `Checking session...`
- `unauthenticated` -> redirect `/login`
- `authenticated` -> render route

Dette skal hindre auth-flash/blink og gjøre route-beskyttelse deterministisk.

## 4) Role & access behavior (UI)

UI er ikke eneste authz-lag, men skal:

- skjule/disable handlinger brukeren ikke har lov til (best effort)
- håndtere `401`/`403` robust

Må-regler:

- `401` -> redirect til `/login`
- `403` -> vis «Access denied»-view med forklaring

MVP scope-rule:

- `editor` kan kun skrive på sider de eier (`createdBy = me`).
- UI må vise tydelig eierskap og forklare hvorfor side er read-only.
- `admin` skal kunne velge forside via settings-side (velg eksisterende publisert side).

## 5) Data & DTOs (frontend contracts)

### 5.1 Auth DTO

`GET /api/auth/me` ->

- `data: { id, email/username?, role }` (frontend tåler flere felt)

Frontend session-state:

- `unknown` (før første `me`-call)
- `authenticated` (user present)
- `unauthenticated`

### 5.2 Page (admin) DTO minimum

Frontend forventer:

- `id`, `slug`, `title`, `locale`, `status`
- `createdAt`, `updatedAt`, `publishedAt?`
- `createdBy`, `updatedBy` (for ownership/audit-kontekst i UI)
- `version`
- `contentSchemaVersion`
- `components` (blocks-basert content-model)
- `bodyRichText` er kun legacy-fallback for eldre sider

Edit-roundtrip-regel (MVP):

- Ved innlasting av eksisterende sider må frontend beholde alle kjente blokktyper (`richText`/`image`/`textImage`/`quote`) også når enkeltdeler av `props` mangler, ved å normalisere til sikre defaults i form-state.
- Frontend skal ikke stille filtrere bort kjente blokker i editoren; manglende obligatoriske felt håndteres som valideringsfeil ved lagring med tydelige feltfeil.

### 5.3 Validation error contract

Ved `400 VALIDATION_ERROR`:

- `error.fieldErrors[]` med `{ path, code, message }`

Implementasjonsnotat (nåværende backend):

- Page-valideringsfeil bruker i praksis `error.code = "INVALID_PAGE_INPUT"`.
- Frontend skal behandle dette som valideringsfeil når `fieldErrors[]` finnes.

Frontend må mappe `path` til riktig input og vise inline-feil + eventuelt feilsammendrag.

### 5.4 Conflict contract

Ved `409 CONFLICT_VERSION`:

- UI viser konfliktmelding
- UI tilbyr `Reload latest` (hent siden på nytt)
- `Copy my changes` er out of scope i MVP

### 5.5 Request DTO minimum (MUST)

`POST /api/pages` body minimum:

```json
{
  "title": "string",
  "slug": "string",
  "locale": "en",
  "template": "page",
  "showTitle": true,
  "showInNav": true,
  "components": [
    {
      "componentType": "richText",
      "props": { "html": "<p>Hello</p>" }
    }
  ],
  "contentSchemaVersion": 1
}
```

`PATCH /api/pages/:id` body minimum:

```json
{
  "version": 1,
  "title": "string",
  "slug": "string",
  "template": "page",
  "showTitle": true,
  "showInNav": true,
  "components": [
    {
      "componentType": "richText",
      "props": { "html": "<p>Hello</p>" }
    }
  ],
  "contentSchemaVersion": 1
}
```

`PATCH /api/settings` body minimum:

```json
{
  "homepagePageId": "page-id-or-null",
  "headerMenuAll": true,
  "headerMenuPageIds": ["page-id-1", "page-id-2"],
  "footerMenuAll": false,
  "footerMenuPageIds": ["page-id-3"]
}
```

Menu-konfig-regler (MVP):

- `Menu`-siden er egen admin-flate for å definere header/footer-navigasjon.
- Hver meny har avhuking `All`; når valgt brukes alle publiserte sider.
- Når `All` er av, velges sider eksplisitt via publiserte sider-listen.

`POST /api/pages/:id/publish` og `POST /api/pages/:id/archive` skal sende tom body (`{}`).

Implementasjonsnotat (nåværende backend):

- Backend aksepterer per nå ikke `contentSchemaVersion` i `PATCH /api/pages/:id`.
- Frontend sender derfor ikke dette feltet i patch-request før backend-kontrakt er oppdatert.

## 6) HTTP client & security

### 6.1 Fetch policy (MUST)

Alle requests:

- `credentials: "include"`
- `Accept: application/json`
- `Content-Type: application/json` på requests med body

### 6.2 CSRF (MUST)

Frontend må støtte CSRF for state-changing endpoints:

- `POST /api/auth/logout`
- `POST /api/pages`
- `PATCH /api/pages/:id`
- `POST /api/pages/:id/publish`
- `POST /api/pages/:id/archive`
- `DELETE /api/pages/:id` (only when page is `ARCHIVED`)
- `DELETE /api/pages/:id`
- `POST /api/auth/register` (når relevant)

CSRF token-strategi (frontend-krav):

Frontend må kunne lese token fra enten:

- `GET /api/auth/me` response (header/body), eller
- separat `GET /api/auth/csrf`, eller
- cookie `XSRF-TOKEN` (double-submit)

På state-changing requests: send token i `X-CSRF-Token` header når token finnes.

Kontrakt for frontend i MVP:

- MUST: state-changing requests skal alltid sende `X-CSRF-Token`.
- SHOULD: hvis token ikke kan leses etter auth-bootstrap, skal frontend:
  - logge tydelig feil (`CSRF token missing; backend misconfigured`)
  - vise tilsvarende UI-feil
  - blokkere mutations (fail fast)

MVP-prioritet for token-kilde:

1. `GET /api/auth/me` (header/body)
2. `GET /api/auth/csrf`
3. `XSRF-TOKEN` cookie (double-submit)

Implementasjonsnotat (nåværende backend):

- Backend eksponerer CSRF-token via `GET /api/auth/me` (body + `x-csrf-token` header) og `GET /api/auth/csrf`.
- Backend validerer `X-CSRF-Token` på autentiserte state-changing endepunkter.
- Frontend støtter fortsatt kompatibilitetsmodus som fallback, og kan settes i streng fail-fast med `VITE_ENFORCE_CSRF_FAIL_FAST=true`.

### 6.3 Rate limit handling

Ved `429`:

- vis tydelig melding (`Too many attempts, try again soon`)
- disable submit midlertidig (MVP: frem til neste manuelle forsøk)

## 7) Pages list (MVP)

### 7.1 Functional requirements

- Hent liste: `GET /api/pages?status=...&locale=en&cursor=...&limit=20&sort=updatedAt:desc`
- Filtre (minst): `status` (`All`/`DRAFT`/`PUBLISHED`/`ARCHIVED`)
- Søk er optional (hvis ikke implementert, ikke vis søke-UI)
- Pagination: `Load more` eller `Next` basert på `meta.nextCursor`

### 7.2 UI requirements

Tabell/liste med kolonner:

- `Title`
- `Slug`
- `Template` (`page` / `post`)
- `Status`
- `Updated`
- `Owner` (display name når tilgjengelig, fallback til owner-id)
- `Actions` (`Edit`, `Archive`) i standard pages-view
- `Actions` (`Edit`, `Delete`) i archived-kontekst

Archived visibility-regel (MVP):

- `All` i statusfilter skal vise `DRAFT` + `PUBLISHED` (ikke `ARCHIVED`).
- `ARCHIVED` vises kun når statusfilter er satt til `ARCHIVED` eller i eget `/pages/archived`-view.
- `Delete`-handling skal kun vises i archived-kontekst.
- `Archive`-handling skal gjøres i edit-view for den enkelte siden (ikke i pages-listen).

Interaksjon (MUST):

- `Title` i pages-list skal være klikkbar lenke til `/pages/:id`.

Empty-state:

- forklar hva «ingen pages» betyr
- CTA: `Create page`

Liste-tilstander (SHOULD):

- `loadingInitial`
- `loadingMore`
- `errorInitial`
- `errorMore` (non-blocking: behold eksisterende liste + vis inline-feil)

## 8) Page editor (MVP)

MVP velger blocks-basert editor (`components[]`) for å støtte reell sidebygging.

Block allowlist (MVP):

- `richText`
- `image`
- `textImage`
- `quote`
- `button`
- `headline`
- `grid`

Public rendering UX baseline (website):

- CMS-blokker skal rendres uten tvungne card/border-wrappere per blokk.
- `button`-blokk og primære website-knapper skal bruke action-grønn token-familie (`action`/`action-hover`/`action-active`).
- Klasse-styrte lenkestiler i komponenter skal ha prioritet over global default-lenkefarge.
- `grid`-blokk skal kunne styre bredde (`100%`/`50%`/`33%`/`25%`), intern innholdsjustering (`left`/`center`/`right`) og plassering av selve grid-container (`left`/`center`/`right`).

Editor interaction (MVP):

- Legg til block fra typevelger
- Rediger block-felter inline i listen
- `grid`-block skal kunne inneholde egne child components (`components[]`) i editoren
- Endre rekkefølge med drag-and-drop per block
- Drag-and-drop skal støtte flytting mellom root-listen og `grid` child-lister (inn i/ut av grid og mellom ulike grids)
- Drag-and-drop skal trigges fra eksplisitt drag-handle per block, ikke ved tekstseleksjon i input/textarea
- Hver block (inkl. child blocks inne i `grid`) skal ha en liten dupliser-handling med ikon i topphjørnet som kopierer blocken rett etter originalen
- `Up`/`Down`-handlinger kan beholdes som fallback
- Slett block per item

Grid-begrensning (MVP):

- Child components inne i `grid` kan være eksisterende innholdsblokker, men nested `grid` inne i `grid` er ikke støttet i MVP.

Media policy i editor (MVP):

- `image` og `textImage` bruker media-bibliotek (ikke fritekst URL).
- Editor skal kunne velge media fra bibliotek og binde valgt `mediaId` til block props.
- Lokal disk-lagring i backend er akseptert for MVP.
- Ved edit/save skal frontend tolerere eksisterende blokker uten `props.url` ved innlasting, og hydrere `url` fra media-listen før submit når `mediaId` finnes.
- Frontend forutsetter at backend eksponerer samme `/uploads/*`-mapping uavhengig av om backend startes fra repo-root eller `Backend/`.
- Public website-klienten SHOULD bruke same-origin asset-proxy (`/api/cms-assets/*`) for relative media-paths, slik at sluttbrukers browser ikke er avhengig av direkte tilgang til CMS-backend-port.

Frontend-validering (UX, backend er source of truth):

- `title` required
- `slug` required + slug-format (lowercase, `-`, alfanumerisk)
- Ved opprettelse: hvis `slug` er tom når `title` mister fokus, autofylles `slug` fra `title`.

Editor-felter:

- `Title` (label + required)
- `Slug` (label + required)
- `Locale` (read-only `en` i MVP, men vis feltet)
- `Template` (`page` eller `post`, default `page`)
- `Show page title on website` (`boolean`, default `true`)
- `Status` (read-only; endres via publish/archive)
- `Content blocks` (`components[]` med enkel reorder)

Layout (MVP):

- Edit/create-view skal bruke tre soner: venstre `Component overview`, midt `Content`, høyre `Page settings`.
- `Page settings` skal inneholde sidefelt som `Title`, `Slug`, `Locale`, `Template` (og status/version i edit).
- `Page settings` skal inneholde sidefelt som `Title`, `Slug`, `Locale`, `Template`, `Show page title on website` (og status/version i edit).
- `Component overview` viser rekkefølge over blocks (inkl. children i `grid`) for rask navigasjon/oversikt.
- `Component overview` skal være klikkbar og scroll/fokusere valgt block i `Content`-kolonnen.
- `Component overview` skal støtte drag-and-drop for rekkefølgejustering av blocks (inkludert child blocks i `grid`).
- Drag i `Component overview` skal kunne startes direkte fra komponentnavnet (ikke eget drag-ikon), og sist valgte item skal markeres aktivt.
- `Content`-kolonnen skal vise drop-indikator som horisontal linje kun mens drag-and-drop pågår (ikke permanente synlige drop-bokser i idle state).
- Tomme `grid` skal fortsatt ha fungerende drop-target i både `Content` og `Component overview`, slik at en eksisterende komponent kan dras inn som første child.
- `Page settings` skal vises som accordion (collapsible), lukket som default til bruker ekspanderer den.
- `showInNav` skal ikke redigeres i page editor; navigasjonsvalg styres i dedikert menu-flate.

Editor-actions (MUST):

- `Save & publish`/`Save & republish`, `Unpublish`, `Archive` vises i egen vertikal actions-kolonne til høyre i edit-view.
- Actions-kolonnen skal være visuelt knyttet til `Page settings` i høyre kolonne, mens `Content` bruker midtkolonnen.
- Primær publiseringsknapp skal være synlig over `Page settings` også når accordion er lukket.
- `Save & publish`/`Save & republish`, `Unpublish` og `Archive` skal ligge over `Page settings`-accordion (ikke inni accordion-innholdet).
- `Content` (`components[]`, blocks-first)

Editor actions:

- `Save & publish` (`PATCH` + `POST publish` i ett klikk)
- `Archive` (`POST archive`)
- `Delete` (`DELETE /api/pages/:id`) kun når status er `ARCHIVED`

Button states:

- `idle`/`submitting`/`success`/`error`

Disable-/confirm-regler (MUST):

- Under `submitting` skal relevante inputs og knapper disables (inkludert `Publish`/`Archive`).
- `Archive` skal kreve bekreftelse (`Are you sure?`) i MVP.
- `Delete` skal kreve bekreftelse og være tilgjengelig kun når side er `ARCHIVED`.
- `Publish` skal være disabled når minst én gjelder:
  - status er ikke `DRAFT`
  - bruker mangler write-access
  - skjema har klientvalideringsfeil

Dirty-state ved navigasjon (SHOULD):

- Hvis skjema er dirty og bruker navigerer bort, vis `You have unsaved changes` (native confirm er ok i MVP).

Etter publish:

- vis `Published at ...`
- vis public endpoint-lenke/URL-string

## 9) Login/logout (MVP)

Login-view:

- Inputs: username/email + password (labels + autocomplete)
- Submit har loading-state
- `401` -> `Invalid credentials`
- `429` -> rate-limit melding
- Success -> redirect til `/pages`

Logout:

- Trigger `POST /api/auth/logout` (med CSRF)
- Clear client session-state
- Redirect til `/login`

## 10) Error handling & messages

### 10.1 Global error boundary (SHOULD)

Fang uventede render-feil og vis fallback med `Reload`.

### 10.2 API error mapping (MUST)

- `400` validation -> inline errors + feilsammendrag
- `401` -> redirect login
- `403` -> access denied view
- `404` -> not found
- `409` -> `Somebody changed this page. Reload latest.`
- default -> `Something went wrong.`

## 11) Accessibility & UX baseline (MUST)

- Full tastaturnavigasjon i core-flows (login, list, create/edit, publish, archive)
- Synlige labels og koblede feilmeldinger
- Fokus ved route-change til `h1` (`tabIndex={-1}`)
- Ved form-submit med feil: fokus til feilsammendrag eller første feilfelt
- Loading/error/empty er tydelig og semantisk markert
- Kontrast minst WCAG 2.1 AA for tekst/interaktive elementer
- Responsivt: core-flows brukbare ned til 360px
- Asynkrone statusmeldinger (`Saved`, `Published`, `Error`) annonseres med `aria-live`:
  - `polite` for suksess/status
  - `assertive` for feil
- Page-liste/tabell skal være tastaturvennlig:
  - actions nås med `Tab`
  - synlig fokusindikator på interaktive elementer

## 12) Testing (frontend minimum)

MUST:

1. én keyboard-path test per feature (kan være manuell sjekkliste i MVP)
2. én form validation test (`title`/`slug`)
3. én publish-flow test (happy path + error path)
4. én editor-test for block rekkefølge (reorder-handling)
5. én editor-test for block-validering (ukjent type/ugyldige props fra API)
6. én media-valgflyt-test (`image`/`textImage` binder riktig `mediaId`)
7. én editor-test for nye interaktive blocks (`button` lenke/new-tab + `headline` level)

SHOULD:

- smoke tests for API-client error mapping (`401`/`403`/`409`)

## 13) Suggested dependencies (MVP)

Velg én av disse profilene (SHOULD):

- `minimal`: `react-router-dom` + egen fetch-wrapper
- `standard`: `react-router-dom` + `@tanstack/react-query`

MVP skal ikke blande disse to mønstrene i samme feature-set.

Valgfrie tillegg:

- `react-hook-form`
- `zod`

## 14) Dev setup

- Vite dev proxy: `/api` -> backend origin
- Environment: `VITE_API_BASE_URL` (tom streng for same-origin/proxy)

TypeScript-policy (frontend):

- Frontend-kode i `Frontend/admin/src` skal være TypeScript (`.ts`/`.tsx`).
- `frontend:check` håndhever test + typecheck + build.

## 15) Definition of Done (Frontend MVP)

MVP er ferdig når:

1. bruker kan logge inn, liste pages, opprette page, redigere/lagre, publisere og arkivere
2. frontend håndterer `401`/`403`/`409`/`400 fieldErrors` korrekt
3. core-flows er tastaturtestet og har eksplisitte UI-tilstander
4. CSRF-token sendes på alle state-changing requests
5. auth-bootstrap og route-guards fungerer uten auth-flash

## 16) API client contract mot backend-team

For tydelig samarbeid uten å låse implementasjon unødig:

- Backend må eksponere en måte å hente CSRF-token på (header/body/cookie)
- Backend må konsekvent returnere `error.code` og `fieldErrors` iht. spec
- Backend må støtte cookie-credentials på same-origin/proxy
