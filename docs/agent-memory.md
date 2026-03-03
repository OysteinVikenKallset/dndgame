# Agent Memory

Dette dokumentet er en kort, levende status for AI-agenter.

## Nåværende status

- TypeScript + Vitest er etablert med streng konfigurasjon
- Clean Architecture-struktur er i bruk (`domain/application/infrastructure/interface`)
- Auth-endepunkter for register/login/logout/me er implementert med TDD
- `PATCH /api/users/me` er implementert med allowlist (`displayName`, `avatarUrl`) og negative tester
- Rate limiting er implementert på `POST /api/auth/register` og `POST /api/auth/login` (`429`, 5 forsøk per 10 min, nøkkel `ip+email`)
- Session-basert auth er aktiv med server-side session store og cookie `sessionId`
- Kvalitetsguardrails er operative (lint, test, build, PR-sjekkliste)
- AI runtime-governance er operativ med global compliance-skill, hard stop/escalation, verification hierarchy og fast `Compliance Summary`
- Coverage policy håndheves på 100% og er grønn
- Docs-system er operasjonalisert med skills, decision tree, agents/reference/guides/runbooks
- SQLite bootstrap er refaktorert til migrasjoner + separat idempotent seed (ikke skjult i DB-konstruktør)
- Repoet har nå eksplisitt agent-bootstrap via `.github/copilot-instructions.md` og `AGENTS.md`
- Docs-guard håndhever nå at `docs/agent-memory.md` oppdateres ved kodeendringer
- Backend oppstart er hardnet med safe-start wrapper som rydder stale/suspenderte `server.ts`-prosesser før ny start
- `npm run dev` bruker nå `concurrently -k` for å unngå orphan-prosesser når en side av dev-flyten stopper
- Public content API støtter nå listing av publiserte sider (`GET /api/content/pages?locale=&limit=`)
- `Frontend/website` bruker publisert side-liste i navigasjon: 5 første i header, alle i footer-grid
- CMS pages-list inkluderer nå `createdBy` for å synliggjøre hvem som opprettet sider
- Backend authz tillater nå `admin` å lese og oppdatere sider på tvers av eierskap
- `GET /api/auth/me` returnerer nå også `role`, og SQLite-brukere har eksplisitt rollefelt (migrasjon + seed)
- CMS API støtter nå `POST /api/pages/:id/unpublish` for overgang fra `PUBLISHED` til `DRAFT`, slik at slug kan endres etter unpublish
- Admin-UI oppretter nå slug automatisk fra tittel ved ny side (uten å overstyre manuelt endret slug)
- Website catch-all route er oppdatert for Next 16 dynamic API (`params`/`searchParams` som Promise) ved å awaite begge før bruk
- Website støtter nå eksplisitt forside via `CMS_HOME_SLUG`; uten config brukes første publiserte side som fallback for `/`
- CMS settings er nå persistente i SQLite (`cms_settings`) med admin-endepunkter for å velge forside-side (`GET/PATCH /api/settings`)
- Website leser nå `GET /api/content/settings?locale=en` for `homepageSlug` før env/fallback-logikk
- Admin-UI har ny `Settings`-side (kun admin) for å velge publisert side som forside
- Admin-UI har nå `My page`-rute (`/me`) med bruker-ID, e-post, displayName og rolle for innlogget bruker
- Settings-visningen gir nå eksplisitt melding ved `403` (kun admin) og `404` (backend må restartes for nye routes)
- `My page` lar nå innlogget bruker oppdatere egen `email`, `displayName` og `role` via `PATCH /api/users/me` (rolle via rullgardin)
- Backend `PATCH /api/users/me` allowlist inkluderer nå `email`, `displayName`, `role`, `avatarUrl`; e-postkonflikt returnerer `409 EMAIL_ALREADY_EXISTS`
- Admin-UI toast/feilmeldinger kan nå lukkes manuelt med `×` i topp-alert
- `My page` sender ikke tom `displayName` automatisk ved lagring, slik at rollebytte fungerer selv om displayName-feltet er tomt
- `Frontend/website` har fått token-basert visuell baseline i `globals.css` (surfaces/text/semantic colors/fokus/prose/skip-link)
- Public website bruker nå delte UI-primitiver (`Container`, `Card`, `ButtonLink`, `Prose`, `AlertBlock`) i header/footer/page-template
- Catch-all route i website genererer nå metadata (title/description) fra CMS-innhold per slug/locale
- Website har nå eksplisitt runtime fallback via `Frontend/website/src/app/error.tsx` i tillegg til forbedret `not-found`
- Ny docs-spec for website-design er lagt til: `docs/frontend-website-design-spec.md`
- Public content-listing i website filtreres nå effektivt til kun sider som fortsatt har status `PUBLISHED` ved snapshot-oppslag
- Backend støtter nå hard delete av sider via `DELETE /api/pages/:id`, men kun når siden er `ARCHIVED`
- Admin pages-list viser nå `Delete`-handling for arkiverte sider med bekreftelsesdialog
- Website følger nå v0.2 designregler i praksis: kuratert/deduplisert header-nav (maks 6), kuratert footer-lenkeliste (maks 8) og stabil rekkefølge
- Public hero viser ikke lenger tekniske metadata (slug/locale) som primærinnhold; viser diskret `Last updated`
- Related pages er nå kuratert/deduplisert, begrenset i antall og viser ikke rå slug som debug-lignende metadata
- Page-komposisjon i website er strammet til `hero -> content -> related -> CTA -> footer` for tydeligere visuell rytme
- Website-dev oppstart (`Frontend/website npm run dev`) bruker nå safe-start wrapper som rydder stale/suspenderte `next`-prosesser på port `3001` automatisk før ny oppstart
- `docs/frontend-website-design-spec.md` er utvidet til v0.3 med konkret visuell baseline (palettverdier, typografi-klasser, spacing/layout-kontrakt, komponentstates og demo-quality gates)
- Website er videre justert mot v0.3: `Container` bruker nå `px-4 sm:px-6`, `main` bruker `py-12 sm:py-16`, hero støtter valgfri intro/lead, og relaterte/header/footer-lenker bruker rene slug-URL-er uten query-støy
- CMS Admin-lenke i website er nå miljøstyrt via `CMS_ADMIN_URL` (`getCmsAdminUrl()`), slik at CTA/header ikke er hardkodet til lokal dev-adresse
- Public page-template er forenklet etter UX-ønske: «Need help?»-kort er fjernet, hero vises uten omsluttende card, `Last updated` vises diskret under tittel, og første avsnitt rendres ikke dobbelt i både lead og body
- CMS Admin-tilgang kan nå vises diskret i footer i stedet for egen CTA-seksjon i innholdsflaten
- CMS støtter nå templatevalg per side (`page`/`post`) i admin-editor (create/edit) via nytt `template`-felt på page
- Public website rendrer nå templatespesifikt: `post` kan vise opprettet-dato diskret under tittel, mens `page` skjuler dato
- Admin pages-list viser nå også `template`-kolonne (`page`/`post`) for rask oversikt uten å åpne edit-siden
- Admin edit-flow normaliserer nå template-feltet robust (`post`/fallback `page`) for å unngå `Invalid page input` ved lagring av eksisterende `page`-sider
- Admin pages-list bruker nå fallbackvisning (`page`) dersom eldre API-respons mangler `template`, og sidetittel i tabellen er klikkbar til edit-route
- Admin edit-page har nå vertikal actions-kolonne til høyre (`Publish`/`Unpublish`/`Archive`), og `Save` er flyttet til bunnen av edit-formen
- Website innholdsområde matcher nå bredden til header-containeren (`max-w-6xl`) for mer konsistent layout
- Website header/footer-nav filtrerer ikke lenger bort slugs med `flow`/tall; alle publiserte sider vises nå (med eksisterende dedupe/limit)
- CMS har nå `showInNav`-støtte per side (default `true`) fra admin-editor, slik at teamet kan styre nøyaktig hvilke publiserte sider som vises i website header/footer
- CMS har nå eget `Menu`-område i admin med separat header/footer-konfig (`All` + valgte publiserte sider), og website leser denne via `GET /api/content/settings`
- Admin pages-list er ryddet: `All` skjuler archived-sider, eget `/pages/archived`-view er lagt til, publish/unpublish er fjernet fra listevisning, delete vises kun i archived-kontekst, og owner vises med display name når tilgjengelig
- Ny side-opprettelse bruker nå slug-autofyll på `title` blur kun når slug-feltet er tomt (ikke kontinuerlig autofyll mens man skriver)
- Admin pages-list er ytterligere strammet: `ARCHIVED` er fjernet fra standard status-dropdown, `Archive`-action er fjernet fra listevisning (gjøres i edit-view), og owner viser nå display name med username-fallback før user-id
- Menu-feilmodus `Invalid list input` er lukket ved å alignere `listPages`-limit med backend-kontrakt (maks 100) i `Menu`-view, samt robust klamping i frontend API-klient med regresjonstest
- Teamets TDD-governance er strammet inn med eksplisitt gate: RED-bevis (testnavn + failure) er nå obligatorisk ved ny/endret atferd, og kontraktskanter/-detaljer (f.eks. limit-grenser/ukjente felter/ugyldige enum) må dekkes i relevante API/DTO/query-endringer
- CMS-dokumentstyring er strammet inn: ved ny/endret CMS-funksjonalitet må både `docs/cms-api-mvp-spec.md` og `docs/guides/cms-mvp-implementation-workflow.md` oppdateres i samme endringssett (for å holde status/checklister synkronisert)
- CMS-spesifikasjoner er utvidet til blocks-first retning (MVP allowlist: `richText`, `image`, `textImage`, `quote`) med media-bibliotek i MVP (lokal disk-lagring i backend), og dokumentstyring krever nå synk mellom tre docs: API-spec, frontend-spec og workflow-guide
- Backlog er etablert i `docs/backlog.md` for produksjonsnære løft: S3-kompatibel media-lagring (erstatter lokal disk i prod) og PostgreSQL som anbefalt database for produksjonsvariant
- Første blocks-implementasjon er levert end-to-end: server-side allowlist-validering for page components, nye media-endepunkter (`POST/GET /api/media`) med lokal fil-lagring + metadata-tabell, admin blocks-editor med enkel reorder (`Up`/`Down`) og media-opplasting/valg, samt website-rendering for `richText`/`image`/`textImage`/`quote`
- Valideringsfeil for page-input er forbedret med konkrete `fieldErrors` for blokk-props (f.eks. manglende `alt` i `textImage`), og admin mapper nå komponent-paths til tydeligere UI-feil i stedet for kun generisk "Invalid page input"
- Admin create/edit hydrerer nå manglende media-URL fra media-biblioteket før lagring av `image`/`textImage`, og edit-normalisering bevarer disse blokkene selv om innlastet data mangler `url`; dette adresserer tilfeller der ikke-`richText` blokker ellers ikke ble lagret/oppdatert stabilt
- `cms-flow.integration.test.ts` er gjort deterministisk for settings ved å sende eksplisitte menyfelter i `PATCH /api/settings`, slik at testen ikke feiler på tidligere persistente DB-innstillinger

## Siste beslutninger

- TypeScript kjøres med strenge regler
- `skipLibCheck` er satt til `false`
- ADR: [0001-strict-typescript-og-vitest](docs/adr/0001-strict-typescript-og-vitest.md)
- Skills følger nå filnavnkonvensjonen `*.skill.md` i `docs/skills/`
- `project-documentation-system.skill.md` er source of truth for docs-regler
- PR-er skal oppdatere relevante docs i samme endring (eller begrunne hvorfor docs er uendret)
- Pre-commit/CI docs-guard krever nå både docs-endring og eksplisitt oppdatering av `docs/agent-memory.md` ved kodeendringer

## Neste foreslåtte steg

- Legge til CI-jobb som validerer at `Compliance Summary` finnes i PR-beskrivelse
- Vurdere signert/strukturert compliance-journal per PR for sterkere sporbarhet

## Arbeidsregler for agenter

- Oppdater denne filen etter større endringer
- Skriv kortfattet hva som er gjort, hvorfor, og hva som er neste
- Referer til ADR ved arkitekturelle beslutninger
