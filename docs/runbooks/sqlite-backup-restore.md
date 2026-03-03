# Runbook: SQLite backup and restore (local)

Last reviewed: 2026-03-02

## Trigger / use cases

- Du vil ta snapshot før større endringer
- Du vil gjenopprette lokal data etter feil
- Du vil flytte lokal demo-data mellom maskiner

## Prerequisites

- Backend bruker SQLite-fil (default: `Backend/data/cms.sqlite`)
- Prosjektavhengigheter installert (`npm install`)

## Backup

```bash
npm run db:backup
```

Output viser kilde og mål.

Standard målmappe:

- `Backend/data/backups/`

## Restore

1. Finn backup-fil i `Backend/data/backups/`
2. Stopp backend-prosessen
3. Kjør restore:

```bash
npm run db:restore -- Backend/data/backups/<backup-file>.sqlite
```

4. Start backend igjen:

```bash
npm run start
```

## Verify after restore

- Logg inn i admin
- Sjekk at forventede pages finnes i `/pages`
- Eventuelt API-sjekk:

```bash
curl -s -c /tmp/cms-cookie.txt -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"password123"}' \
  http://127.0.0.1:3000/api/auth/login >/dev/null

curl -s -b /tmp/cms-cookie.txt 'http://127.0.0.1:3000/api/pages?status=ALL&limit=50'
```

## Notes

- Backup/restore er lokal "light"-prosedyre, ikke full produksjonsstrategi.
- Sett `SQLITE_DB_PATH` hvis du bruker alternativ db-fil.
