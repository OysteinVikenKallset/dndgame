# Runbook: SQLite migrate and seed (local)

Last reviewed: 2026-03-02

## Trigger / use cases

- Ny lokal database skal settes opp deterministisk
- Du vil sikre at schema er i sync med migrasjonskjeden
- Du vil legge inn baseline seed-data uten manuelle SQL-steg

## Policy summary

- Migrasjoner er source of truth for schema-evolusjon
- Seed holdes separat fra migrasjoner
- Begge kommandoer er trygge å kjøre flere ganger (idempotent)

## Commands

```bash
# Kjør alle pending migrasjoner
npm run db:migrate

# Kjør baseline seed (alice@example.com) hvis den mangler
npm run db:seed
```

## Standard flyt for ny lokal DB

1. Sett eventuell custom DB-path:

```bash
export SQLITE_DB_PATH=Backend/data/cms.sqlite
```

2. Kjør migrasjoner:

```bash
npm run db:migrate
```

3. Kjør seed:

```bash
npm run db:seed
```

4. Start backend:

```bash
npm run start
```

## Verify

- `npm run db:migrate` rapporterer ingen pending migrasjoner ved ny kjøring
- `npm run db:seed` rapporterer at seed allerede finnes ved ny kjøring
- Login fungerer for baseline-bruker:

```bash
curl -s -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"password123"}' \
  http://127.0.0.1:3000/api/auth/login
```

## Notes

- Backend kjører migrasjoner automatisk ved oppstart.
- I ikke-produksjon kjøres baseline seed automatisk ved oppstart.
- Sett `SQLITE_RUN_SEED=false` for å deaktivere automatisk seed i miljøer der dette ikke er ønsket.
