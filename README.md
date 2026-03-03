# dndgame

Dette prosjektet eksponerer et API fra Express-backend. Derfor får du `Cannot GET /` på `http://localhost:3000`.

## Struktur (monorepo)

- `Backend/`: CMS/backend (kjerne)
- `Frontend/admin/`: admin-UI for CMS
- `Frontend/website/`: separat test/forbruker-app (Next.js)

Målet er at CMS-kjernen i `Backend/` skal kunne gjenbrukes uavhengig av hvilke klientapper som finnes.

## Quick commands

```bash
# Installer root-avhengigheter
npm install

# Start backend (CMS API)
npm run start

# Start admin-frontend
npm run frontend:dev

# Start website-testapp (Next.js)
npm run website:dev

# Kjør backend + admin samtidig
npm run dev
```

## Kjør backend

```bash
npm install
npm run start
```

Backend kjører på `http://localhost:3000`.

## Data-persistens (SQLite)

- Backend bruker nå SQLite-fil som standard, så opprettede sider/brukere/sessions overlever restart.
- Standard DB-fil: `Backend/data/cms.sqlite`
- Override sti via miljøvariabel: `SQLITE_DB_PATH=/path/to/local.sqlite`
- Schema styres av migrasjoner (`npm run db:migrate`)
- Seed kjøres separat (`npm run db:seed`) og er idempotent
- Ved backend-start kjøres migrasjoner automatisk; baseline seed kjøres automatisk utenfor production

### Migrate / seed (lokalt)

```bash
# sørg for at schema er oppdatert
npm run db:migrate

# opprett baseline bruker dersom den mangler
npm run db:seed
```

Baseline bruker: `alice@example.com` / `password123`

### Backup / restore (lokalt)

```bash
# ta backup
npm run db:backup

# restore fra backup (stopp backend først)
npm run db:restore -- Backend/data/backups/<backup-file>.sqlite
```

Detaljert runbook: `docs/runbooks/sqlite-backup-restore.md`.
Migrasjon/seed runbook: `docs/runbooks/sqlite-migrate-seed.md`.

## Kjør React-frontend

```bash
npm run frontend:install
npm run frontend:dev
```

Frontend kjører på `http://localhost:5173` og proxyer `/api` til backend (`localhost:3000`).

## Kjør website-testapp (Next.js)

```bash
npm run website:install
npm run website:dev
```

Website kjører på `http://127.0.0.1:3001`.

## Om gjenbrukbarhet

- Ja: dagens struktur passer godt for et generelt, gjenbrukbart CMS.
- `Frontend/website` er en separat forbruker/testapp og kan slettes senere uten konsekvenser for backend eller admin-frontend.
- Hvis du sletter `Frontend/website`, bør du også fjerne `website:*`-scripts i `package.json` for å holde rot-scripts ryddige.

## Frontend-ruter (MVP)

- `/login`
- `/pages`
- `/pages/new`
- `/pages/:id`
- `/pages/:id/preview`

## CSRF (frontend)

- Frontend sender `X-CSRF-Token` på mutation-endepunkter.
- Backend eksponerer token via `GET /api/auth/me` og `GET /api/auth/csrf`.
- Backend validerer `X-CSRF-Token` på autentiserte mutation-endepunkter.
- For streng fail-fast lokalt, sett `VITE_ENFORCE_CSRF_FAIL_FAST=true` i frontend-miljøet.
- Uten denne variabelen tillates kompatibilitetsmodus dersom token ikke kan leses.

## Testet flyt i frontend

1. Registrer bruker (eller bruk seed-bruker `alice@example.com` / `password123`)
2. Logg inn
3. Opprett side
4. Publiser side
5. Hent offentlig JSON for slug
