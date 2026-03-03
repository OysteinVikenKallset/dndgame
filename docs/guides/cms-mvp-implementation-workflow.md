# Guide: CMS MVP Implementation Workflow

Last reviewed: 2026-03-02

## Purpose

Kjøre CMS MVP implementasjon i riktig rekkefølge med tydelige test- og review-punkter per fase.

Primær kontrakt: `docs/cms-api-mvp-spec.md`.

Status sync-regel:

- Ved endring i CMS-funksjonalitet (backend API, admin-flyt, public content-delivery) MUST både `docs/cms-api-mvp-spec.md`, `docs/frontend-cms-mvp-spec.md` og denne guiden oppdateres i samme endringssett.
- Checklister/status i disse tre dokumentene skal beskrive samme virkelige implementasjonsstatus.

## Required docs before coding

1. `docs/reference/skill-routing-matrix.md`
2. `docs/skills/ai-agent-doc-compliance.skill.md`
3. `docs/skills/api-contracts-and-versioning.skill.md`
4. `docs/skills/authorization-and-access-control.skill.md`
5. `docs/cms-api-mvp-spec.md`
6. `docs/testing-strategy.md`

## Phase order (must follow)

1. Foundation (schema/migrations/logging)
2. Auth & security baseline
3. Pages admin API
4. Blocks + media baseline
5. Public content API
6. Authorization & audit
7. Contract/release gates

## Daily PR checklist (short)

- [ ] Endringen følger én fase i rekkefølgen over.
- [ ] Nye/endrede endepunkter har kontrakttest.
- [ ] Statuskoder + error envelope matcher spec.
- [ ] Authz-regel (`editor` owner, `admin` full) er håndhevet.
- [ ] CSRF er aktiv for state-changing endepunkter.
- [ ] Public API leser kun publication snapshot.
- [ ] Docs-impact er oppdatert i samme PR.
- [ ] Ved CMS-funksjonalitet er API-spec, frontend-spec og workflow-guide oppdatert i samme PR.

## Endpoint minimums

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Test minimum:

- [ ] `200` login happy path
- [ ] `401` login fail
- [ ] logout invaliderer session
- [ ] `me` gir `401` uten session

### Pages (admin)

- `GET /api/pages`
- `POST /api/pages`
- `GET /api/pages/:id`
- `PATCH /api/pages/:id`
- `POST /api/pages/:id/publish`
- `POST /api/pages/:id/unpublish`
- `POST /api/pages/:id/archive`
- `DELETE /api/pages/:id` (kun for `ARCHIVED`)
- `GET /api/settings`
- `PATCH /api/settings`

Test minimum:

- [ ] `400` validation med stabil `fieldErrors`
- [ ] `401` unauthenticated
- [ ] `403` forbidden
- [ ] `404` not found
- [ ] `409` conflict + `CONFLICT_VERSION` ved versjonskollisjon

### Content (public)

- `GET /api/content/pages?locale=en&limit=20`
- `GET /api/content/pages/:slug?locale=en`
- `GET /api/content/settings?locale=en`
- `GET /api/content/pages/:id/preview` (authenticated)

Test minimum:

- [ ] Public endpoint returnerer kun `PUBLISHED`
- [ ] Draft returnerer `404` i public endpoint
- [ ] Preview krever auth
- [ ] Caching-kontrakt (`ETag` eller valgt `Cache-Control`) verifisert

### Blocks + media

- `components[]` med allowlist (`richText`, `image`, `textImage`, `quote`)
- `POST /api/media`
- `GET /api/media`

Test minimum:

- [ ] Ukjent `componentType` gir `400` med stabil `fieldErrors`
- [ ] Ugyldige block-props gir `400` med stabil `fieldErrors`
- [ ] Reorder i editor gir deterministisk render-rekkefølge
- [ ] Media upload/list happy path + feilflyt

## Hard stop

Stopp og avklar før videre implementasjon hvis:

- preview-policy, slug-policy eller snapshot-policy avviker fra spec
- API-kontrakt (DTO/error/statuskoder) er uklar eller inkonsistent
- authz-scope for `editor` er uklart i aktuell use-case

## Release gate

- [ ] `npm run check`
- [ ] `npm run docs:guard:ci`
- [ ] Compliance Summary er utfylt i PR

## Current MVP status snapshot (2026-03-02)

Implementert (hovedlinjer):

- Auth baseline: login/logout/me, CSRF på state-changing endepunkter, rate limiting på login/register.
- Pages API: list/create/get/update/publish/unpublish/archive/delete (delete kun når side er archived).
- Settings API: `GET/PATCH /api/settings` med admin-only policy.
- Public API: liste, slug-oppslag, preview og content settings.
- Snapshot-basert publisering og cache-policy (`Cache-Control: no-store`) er på plass.
- Authz policy: `editor` begrenset til egne sider, `admin` full tilgang.
- Blocks-first baseline er implementert i API/admin/website (`richText`, `image`, `textImage`, `quote`).
- Media-bibliotek baseline er implementert med `POST/GET /api/media` og lokal disk-lagring i backend.
- Admin editor hydrerer nå manglende media-URL (`mediaId -> url`) før create/update, slik at eksisterende image/textImage-blokker kan lagres oppdatert også når `props.url` mangler i innlastet data.

Gjenstående kritiske MVP-gap:

- Audit trail mangler (`audit_events` + utslipp av definerte events).
- Session-cookie-policy mangler eksplisitt `Secure` i produksjon.
- Foundation/DB-kontrakt for publisert slug-locale må strammes inn tydelig.
- Konsistent `fieldErrors`-shape er delvis implementert (inkl. blokkvalidering), men ikke fullstendig verifisert på tvers av alle valideringsfeil.
- Full drag-and-drop i editor er ikke implementert ennå (MVP bruker enkel reorder med `Up`/`Down`).
- Tastaturflyt-test for kritisk adminflyt mangler.
- Egen, eksplisitt CI-verifisering av migrasjonskjøring mangler.
