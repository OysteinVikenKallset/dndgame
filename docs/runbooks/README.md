# Runbooks

Last reviewed: 2026-02-28

Denne mappen inneholder operative feilsøkingsguider.

## Når brukes runbooks

- CI-feil som ikke er åpenbare
- Ustabil test- eller build-atferd
- Produksjonsnære incident-scenarier

## Minstekrav per runbook

- Trigger/symptom
- Steg for diagnose
- Steg for mitigering
- Verifikasjon etter fix

## Runbooks i bruk

- `backend-suspended-process.md` (frontend står på "Checking session...", backend svarer ikke)
- `sqlite-backup-restore.md` (ta backup og restore av lokal SQLite-database)
- `sqlite-migrate-seed.md` (kjor migrasjoner og baseline seed deterministisk)

## Policy for kontinuerlig forbedring

Når en ny feilmodus oppdages (eller eksisterende dokumentasjon var utilstrekkelig), MUST relevant runbook/policy oppdateres i samme PR som fiksen.
