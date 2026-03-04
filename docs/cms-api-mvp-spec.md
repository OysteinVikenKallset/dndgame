# CMS Requirements Specification (Headless) — v0.2

Last reviewed: 2026-03-02

## 1) Purpose & scope

Build a headless CMS that allows authenticated users to manage pages and content, and exposes content as JSON for frontend consumption.

MVP scope includes:

- Authentication and sessions
- Page/content management
- Publish/archive workflow
- Public JSON content delivery endpoints

## 1.2) Accessibility & UX baseline (MVP)

- Admin UI MUST be keyboard navigable for core flows (login, page create/edit/publish).
- Forms MUST provide labels and accessible error messages.
- Color contrast MUST meet WCAG 2.1 AA minimum.
- Critical admin flows SHOULD be responsive down to 360px viewport width.
- Loading, error, and empty states MUST be explicit and understandable.

## 1.1) Implementation constraints / non-goals

Hard constraints for this MVP:

- Admin dashboard MUST be built with Next.js (React) using App Router.
- API style MUST remain headless JSON (no server-rendered CMS templates as primary delivery format).
- Authentication strategy MUST remain cookie-based sessions for MVP.
- Browser support target SHOULD be latest 2 stable versions of major modern browsers.

Non-goals for MVP:

- Replacing Next.js with another frontend framework.
- Building a full custom design system platform.

## 2) User roles & access

Roles:

- `admin`
- `editor`
- `viewer` (optional in MVP UI, but role is reserved)

Permissions (MVP):

- `admin`: manage users, roles, content, and CMS settings
- `editor`: create/edit/publish pages they own
- `viewer`: read-only in admin UI

MVP authorization scope rule:

- `editor` write-access is limited to pages where `createdBy = me`.
- `admin` has full read/write access.
- "Assigned scope" is deferred and out of scope for MVP.

Authorization policy:

- Server-side authorization is mandatory.
- Default deny: any ungranted action must be rejected.

## 3) Authentication & sessions

Required capabilities:

- Login, logout, and session management
- `GET /api/auth/me` endpoint for current user
- Rate limiting on login/register in MVP
- Secure password policy and storage (hashing, never plaintext)

Chosen policy for this project (MVP):

- Cookie-based session authentication.
- Session cookie should be `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.

Security baseline additions:

- State-changing endpoints MUST have CSRF protection.
- Session SHOULD rotate on login and privilege change.
- Login SHOULD have brute-force protection (lockout and/or progressive backoff).

## 4) Core content model

### Page

Fields:

- `id`
- `slug` (unique per locale)
- `title`
- `locale` (e.g. `en`, `en-US`, `en-GB`)
- `status`: `DRAFT | PUBLISHED | ARCHIVED`
- `template`: `page | post` (default `page`)
- `showTitle`: `boolean` (default `true`) for om side-tittel (`h1`) skal vises i public website-template
- `showInNav`: `boolean` (default `true`) for public header/footer visibility
- `createdAt`, `updatedAt`, `publishedAt?`
- `createdBy`, `updatedBy`
- `version` (optimistic locking)
- `contentSchemaVersion`

Content body model:

- Recommended: `components: ComponentInstance[]`
- Simpler fallback: `bodyRichText`

If components model is used:

- Each item must include `componentType` and `props`.
- `props` must be validated against allowlist/schema per `componentType`.

Blocks-first policy (current direction):

- Nye sider SHOULD lagres som `components[]` (ikke ren `bodyRichText`).
- Public frontend rendrer komponenter fra JSON med en registrert block-renderer per `componentType`.
- `bodyRichText` beholdes kun som legacy-fallback for eldre innhold.

MVP block allowlist (v0.4)

- `richText`
  - `props`: `{ "html": string }`
- `image`
  - `props`: `{ "mediaId": string, "alt": string, "caption?": string }`
- `textImage`
  - `props`: `{ "title?": string, "text": string, "mediaId": string, "alt": string, "layout": "imageLeft" | "imageRight" }`
- `quote`
  - `props`: `{ "quote": string, "author?": string }`
- `button`
  - `props`: `{ "label": string, "url": string, "openInNewTab": boolean }`
- `headline`
  - `props`: `{ "text": string, "level": "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }`
- `grid`
  - `props`: `{ "width": "100" | "50" | "33" | "25", "contentAlign": "left" | "center" | "right", "selfAlign": "left" | "center" | "right", "components": ComponentInstance[] }`
  - `components[]` i `grid` kan inneholde eksisterende blokktyper, men nested `grid` er ikke støttet i MVP.

MUST-regler for blocks:

- `componentType` utenfor allowlist avvises med `400 VALIDATION_ERROR`.
- Block `props` valideres server-side med stabil `fieldErrors`-shape.
- Render-order skal følge rekkefølgen i `components[]` deterministisk.

Presentasjonsnotat (ikke API-kontrakt):

- Public website rendrer nå blocks uten tvungne card/border-wrappere rundt hver blokk.
- Knappepresentasjon i website bruker grønn action-token-palett for `button`-blokken og øvrige primærknapper.
- Admin editor støtter nå drag-and-drop for rekkefølge og flytting av blokker inn i/ut av `grid`.
- Admin editor støtter nå også duplisering av blocks (inkludert child blocks i `grid`) via egen ikonhandling per block.
- Admin editor bruker nå eksplisitt drag-handle per block for å unngå utilsiktet drag ved tekstseleksjon.
- Admin editor-layout er oppdatert til tre soner (`Component overview` venstre, `Content` midt, `Page settings` høyre), der `Page settings` er collapsible accordion.
- `showInNav` redigeres ikke i page editor (styres i `Menu`), mens `showTitle` redigeres i `Page settings`.
- `Component overview` i admin er nå både klikkbar (scroll/fokus til valgt block) og støtteflate for drag-and-drop rekkefølgejustering.
- Drag i `Component overview` skjer nå direkte fra komponentnavn (uten eget drag-ikon), og aktivt valgt item markeres visuelt.
- `Content`-kolonnen bruker nå drag-only drop-indikatorer (horisontal linje) i stedet for permanente synlige drop-bokser, inkludert fungerende drop-target for tomme grids.
- Admin edit-flow bruker nå én synlig primærhandling for publisering (`Save & publish` / `Save & republish`) som lagrer og publiserer i ett klikk.

Content delivery rules:

- Frontend fetches published content only by default.
- Public content endpoints MUST NEVER return draft content.

Slug lifecycle policy (MVP):

- Changing `slug` is forbidden when page status is `PUBLISHED`.
- To change slug, page must first be archived/unpublished according to implementation policy.

Preview policy (MVP):

- Preview strategy is auth-only.
- `GET /api/content/pages/:id/preview` requires authenticated CMS user.
- Signed preview tokens are out of scope for MVP.

## 5) Publishing workflow (MVP)

- `DRAFT -> PUBLISHED`
- Archive flow supported via explicit archive action
- Unpublish is optional in MVP

Recommendation:

- Publishing should create a stable, cacheable representation.

Operational rule (MVP):

- On publish, system MUST create an immutable publication snapshot containing published version and serialized public JSON.
- Public delivery endpoints MUST read from latest published snapshot, not live draft table.
- `ETag` and/or `Last-Modified` SHOULD be derived from snapshot metadata (`publishedAt` and/or snapshot hash).

## 6) Localization

- Admin UI language MUST be English.
- API human-readable messages SHOULD be English.
- `error.code` values MUST be stable machine codes.

Locale support:

- MVP content locale: `en` only
- Data model must include `locale` now, so additional locales can be added later without breaking schema

## 6.1) Glossary

- Page: Editable CMS content entity with lifecycle state.
- Draft: Non-public editable state.
- Publication snapshot: Immutable serialized public representation created at publish time.
- Preview: Authenticated read of non-public content.
- Published content: Snapshot-backed public JSON visible on public endpoints.

## 7) API (JSON) — minimum endpoints

All endpoints use `application/json`.

### Auth

- `POST /api/auth/register` (optional if users are admin-created only)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Pages (admin)

- `GET /api/pages` (pagination + filter by status/locale + sorting)
- `POST /api/pages`
- `GET /api/pages/:id`
- `PATCH /api/pages/:id`
- `POST /api/pages/:id/publish`
- `POST /api/pages/:id/unpublish`
- `POST /api/pages/:id/archive` (preferred over hard delete in MVP)
- `DELETE /api/pages/:id` (allowed only when page status is `ARCHIVED`)

### Settings (admin)

- `GET /api/settings`
- `PATCH /api/settings`

### Media (admin)

- `POST /api/media` (multipart upload)
- `GET /api/media` (list metadata)
- `DELETE /api/media/:id` (optional i MVP)

Media policy (MVP):

- Lagring: lokal disk i backend-miljø (dev/MVP), med metadata i DB.
- Public URL skal returneres som del av media-metadata.
- Storage-abstraksjon MAY innføres senere for S3-kompatibel backend.
- Admin-klient skal ved lagring av `image`/`textImage` hydrere manglende `props.url` fra media-bibliotek (`mediaId -> url`) før request sendes.
- Admin edit-klient SHOULD beholde kjente blokktyper (`richText`/`image`/`textImage`/`quote`) ved innlasting selv om enkelte props mangler, ved å normalisere til trygge defaults og la bruker rette feltene før lagring.
- Backend upload/static path MUST være robust mot oppstart fra både repo-root og `Backend/`-katalog, slik at `/uploads/*` peker til samme fysiske mappe i begge tilfeller.
- Public website MAY proxy relative asset-paths via eget same-origin endpoint (f.eks. `/api/cms-assets/*`) som videresender til CMS-backend, slik at browser ikke må nå backend-port direkte.

`PATCH /api/settings` body (MVP):

```json
{
  "homepagePageId": "page-id-or-null",
  "headerMenuAll": true,
  "headerMenuPageIds": ["page-id-1", "page-id-2"],
  "footerMenuAll": false,
  "footerMenuPageIds": ["page-id-3"]
}
```

Rules:

- Kun `admin` kan lese/endre settings-endepunktene.
- `homepagePageId` må peke til en eksisterende `PUBLISHED` side i samme CMS.
- `homepagePageId: null` nullstiller eksplisitt valgt forside.
- `headerMenuAll` og `footerMenuAll` styrer om henholdsvis header/footer viser alle publiserte sider.
- Når `headerMenuAll` eller `footerMenuAll` er `false`, brukes tilsvarende `*MenuPageIds` til å velge eksakte publiserte sider.
- `*MenuPageIds` med ugyldige/ikke-publiserte side-id-er blir ignorert i lagring/respons.

MVP authz-presisering for page mutasjoner:

- `editor` kan opprette/endre egne sider (`createdBy = me`)
- `admin` kan lese/endre sider uavhengig av `createdBy`

### Content delivery (public)

- `GET /api/content/pages?locale=en&limit=20` returns latest published pages (summary list)
- `GET /api/content/pages/:slug?locale=en` returns published page JSON
- Public DTO MAY return `showTitle: false` når sidetittel skal skjules; fravær betyr `true`.
- `GET /api/content/settings?locale=en` returns public CMS settings for nettsted (f.eks. `homepageSlug` + `menu` for header/footer)
- `GET /api/content/pages/:id/preview` requires authenticated CMS user

## 8) API conventions

MUST:

- Stable DTO contracts
- Standard error envelope with `error.code` and `error.message`
- Paginated list format: `data` + `meta`
- Contract tests for endpoint contracts
- Public content endpoints return stable public DTO (not internal DB shape)

SHOULD:

- Define idempotency policy (`POST` vs `PUT`)
- Support `Idempotency-Key` for create operations if duplicate-submit risk is relevant

Status code mapping (MVP):

- `400` validation error
- `401` unauthenticated
- `403` forbidden
- `404` not found
- `409` conflict (slug uniqueness or optimistic lock)
- `429` rate limited

Validation error shape (MVP):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Fix the highlighted fields",
    "fieldErrors": [
      {
        "path": "title",
        "code": "REQUIRED",
        "message": "Title is required"
      }
    ]
  }
}
```

Implementation note (current backend):

- Page-endepunkter bruker per nå `error.code: "INVALID_PAGE_INPUT"` for valideringsfeil.
- Ved blokkvalidering (f.eks. `components[].props.alt`) returneres konkrete `fieldErrors[]` med path/code/message.
- `error.message` for disse valideringsfeilene er "Fix the highlighted fields".

Pagination and filtering contract (MVP):

- `GET /api/pages?status=PUBLISHED&locale=en&cursor=...&limit=20&sort=updatedAt:desc`
- Default sort is `updatedAt desc`.
- `meta` shape:

```json
{
  "meta": {
    "nextCursor": "opaque-cursor",
    "total": 123
  }
}
```

`GET /api/pages` item-felter (MVP):

- `id`, `slug`, `title`, `locale`, `status`
- `createdBy` (bruker-id som opprettet siden)
- `createdByDisplayName?` (valgfri visningsverdi for owner i admin-liste)
- `createdByUsername?` (valgfri fallback, typisk local-part fra owner e-post)
- `updatedAt`, `publishedAt?`, `version`

Concurrency contract (MVP):

- `PATCH /api/pages/:id` MUST include `version` in request body.
- On version mismatch, return `409` with `error.code = "CONFLICT_VERSION"`.

Standard response envelopes:

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Short client-friendly message"
  }
}
```

Public content DTO minimum:

- `id`, `slug`, `locale`, `title`, `publishedAt`
- Optional navigation metadata: `showInNav` (`true` by default when omitted)
- Optional template metadata for public rendering policy: `template` and `createdAt` (typically present for `post`)
- Content fields: `components` (MVP-standard)
- Legacy fallback: `bodyRichText` MAY returneres for eldre sider uten `components`
- Audit/internal fields (`createdBy`, `updatedBy`, internal flags) MUST NOT be exposed in public API.

## 9) Data persistence (MVP)

- Persistent database is required.
- PostgreSQL is the default recommendation.
- Migrations are required for schema changes.

Current implementation note (local MVP):

- Backend runs on SQLite for local persistence (`Backend/data/cms.sqlite`).
- PostgreSQL remains recommended target for staging/production rollout.

Constraints:

- Uniqueness policy for published content by `slug + locale`
- Foreign keys for ownership and audit fields
- Optimistic locking via `version` (or strict `updatedAt` conditional updates)
- Schema evolution for content is managed via `contentSchemaVersion`.

## 10) Audit trail (MVP)

The system should log auditable events including:

- `PAGE_CREATED`
- `PAGE_UPDATED`
- `PAGE_PUBLISHED`
- `ROLE_CHANGED`
- `AUTHZ_DENY`

Audit event fields:

- `actor`
- `resource`
- `timestamp`
- `reason`

Audit/logging guardrails:

- Audit logs MUST NOT contain secrets (passwords, session IDs, raw tokens).
- Logs and audit events SHOULD include `requestId`/correlation id.

## 11) Non-functional requirements

- Security: least privilege + default deny
- Observability: structured logs
- Performance: cache headers for published content (optional in MVP)
- Backups: lightweight backup/restore procedure documented before destructive migrations

Caching baseline (MVP):

- Public content endpoint must define caching contract: either `ETag`/conditional requests or explicit `Cache-Control` policy.

## 12) Definition of Done (MVP)

MVP is done when:

- A user can login, create a page, publish it, and fetch it via public JSON endpoint.
- Contract tests are green.
- Migrations run in CI.
- Authorization is enforced and audit events are recorded for critical actions.
- Core admin flows include keyboard path test and explicit loading/error states.
- CSRF protection is active for all state-changing endpoints.
- Public endpoint caching contract is present and tested.

## 13) Implementation checklist (API-first)

Use this sequence to implement MVP with minimal rework.

Companion guide: `docs/guides/cms-mvp-implementation-workflow.md`.

Status note (2026-03-02): checklisten under er oppdatert mot nåværende kodebase. Uavklarte/ufullstendige punkter står fortsatt åpne.

### 13.1 Foundation

- [ ] Set up DB schema + migrations (`users`, `pages`, `page_publications`, `audit_events`, `sessions`). _(Delvis: `users`, `pages`, `publication_snapshots`, `sessions` er på plass; `audit_events` mangler.)_
- [ ] Add uniqueness constraints for published slug-locale policy.
- [x] Add ownership/audit foreign keys (`createdBy`, `updatedBy`).
- [x] Add `version` and `contentSchemaVersion` fields.
- [ ] Add structured logging with `requestId`/correlation id.

### 13.2 Auth & security baseline

- [x] Implement `POST /api/auth/login`.
- [x] Implement `POST /api/auth/logout`.
- [x] Implement `GET /api/auth/me`.
- [ ] Enforce cookie-session policy (`HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production). _(Delvis: `Secure` i produksjon er ikke håndhevet i cookie-builder.)_
- [x] Add CSRF protection on all state-changing endpoints.
- [x] Add rate limiting and brute-force mitigation for auth endpoints.

Endpoint test minimum:

- [x] Login happy path (`200`) and invalid credentials (`401`).
- [x] Logout invalidates session and clears cookie.
- [x] Me returns user when authenticated, `401` when unauthenticated.

### 13.3 Pages admin API

- [x] Implement `GET /api/pages` with `status`, `locale`, `cursor`, `limit`, `sort`.
- [x] Implement `POST /api/pages` with validation and ownership assignment.
- [x] Implement `GET /api/pages/:id` with authz check.
- [x] Implement `PATCH /api/pages/:id` with `version` concurrency requirement.
- [x] Implement `POST /api/pages/:id/publish` with immutable snapshot creation.
- [x] Implement `POST /api/pages/:id/archive`.
- [x] Enforce slug policy for `PUBLISHED` pages (no slug change).

Endpoint test minimum:

- [ ] Validation failures return `400` + stable `fieldErrors` shape. _(Delvis: page update/create returnerer nå `fieldErrors` for blokkvalidering og sentrale request-felt; resterende valideringsstier må harmoniseres.)_
- [x] Unauthenticated access returns `401`; forbidden owner/scope returns `403`.
- [x] Not found returns `404`.
- [x] Slug/unique conflicts return `409`.
- [x] Version mismatch returns `409` + `CONFLICT_VERSION`.
- [x] Publish creates snapshot; archive blocks future public delivery.

### 13.4 Public content API

- [x] Implement `GET /api/content/pages/:slug?locale=en` from publication snapshot only.
- [x] Implement `GET /api/content/pages/:id/preview` (authenticated CMS users only).
- [x] Ensure public DTO excludes internal/audit fields.
- [x] Add caching contract (`ETag`/conditional requests or explicit `Cache-Control`).

Endpoint test minimum:

- [x] Public endpoint returns only `PUBLISHED` content.
- [ ] Draft page on public endpoint returns `404`.
- [ ] Preview returns draft for authenticated CMS user.
- [x] Caching headers are present per chosen policy.

### 13.5 Authorization & audit

- [x] Enforce `editor` write access only for `createdBy = me`.
- [x] Enforce `admin` full access.
- [ ] Emit audit events: `PAGE_CREATED`, `PAGE_UPDATED`, `PAGE_PUBLISHED`, `ROLE_CHANGED`, `AUTHZ_DENY`.
- [ ] Ensure audit logs never include secrets.

Endpoint test minimum:

- [ ] Authz deny paths produce `403` and `AUTHZ_DENY` audit event.
- [ ] Successful mutations emit expected audit events with actor/resource/timestamp.

### 13.6 Contract and release gates

- [x] Add contract tests for response envelopes and status mapping.
- [ ] Add migration execution in CI pipeline.
- [ ] Add keyboard-path test for at least one critical admin flow.
- [ ] Verify DoD checklist in section 12 before MVP sign-off.

### 13.8 Blocks & media baseline

- [x] Implement server-side allowlist validation for `components[]` (`richText`, `image`, `textImage`, `quote`, `button`, `headline`, `grid`).
- [x] Ensure `PATCH/POST /api/pages` supports persisted blocks as first-class content model.
- [x] Implement media endpoints (`POST/GET /api/media`) with local disk storage for MVP.
- [x] Return stable media metadata DTO (`id`, `url`, `filename`, `mimeType`, `sizeBytes`, `createdAt`).

Endpoint test minimum:

- [x] Unknown `componentType` returns `400` (via existing `INVALID_PAGE_INPUT` contract).
- [x] Invalid block props return `400` (via existing `INVALID_PAGE_INPUT` contract).
- [ ] Blocks renderes i samme rekkefølge som lagret i `components[]`.
- [x] Media upload/list happy path + validation error path.

### 13.7 Remaining gaps (short)

Det viktigste som gjenstår for MVP-signoff per dagens status:

- Audit trail-laget mangler (`audit_events` + utslipp av definerte audit-eventer).
- Session-cookie-policy må fullføres med `Secure` i produksjon.
- Foundation-punktet for publikasjon/unikhetskontrakt bør strammes inn eksplisitt i DB/policy.
- `fieldErrors`-shape er delvis harmonisert (inkludert blokkvalidering), men ikke fullstendig verifisert på tvers av alle valideringsstier.
- Tastaturflyt-test for kritisk adminflyt mangler.
- Egen, eksplisitt CI-verifisering av migrasjonskjøring mangler.
