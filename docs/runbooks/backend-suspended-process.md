# Runbook: Backend process suspended (frontend står på "Checking session...")

Last reviewed: 2026-02-28

## Trigger / symptom

- Frontend står fast på `Checking session...`
- `/api/auth/me` timeout-er i nettleser eller `curl`
- Backend ser ut til å ha startet tidligere, men svarer ikke

## Typisk rotårsak

Backend-prosessen er **suspendert** (typisk via `Ctrl+Z`) i stedet for stoppet.
Da kan port 3000 fortsatt være i `LISTEN`, men requester blir ikke prosessert.

## Diagnose

1. Sjekk API-respons:

```bash
curl -i --max-time 3 http://127.0.0.1:3000/api/auth/me
```

- Forventet ved ikke-innlogget bruker: `401 Unauthorized`
- Feiltilstand: timeout uten response-bytes

2. Finn prosess på port 3000:

```bash
ss -ltnp | grep ':3000 '
```

3. Sjekk prosessstatus (`STAT`):

```bash
ps -o pid,ppid,stat,etime,time,%cpu,%mem,wchan:32,cmd -p <PID>
```

- Hvis `STAT` inkluderer `T` (f.eks. `Tl`), er prosessen stoppet/suspendert.

## Mitigering

- Reaktiver prosessen:

```bash
kill -CONT <PID>
```

- Eller hent tilbake jobb i terminalen:

```bash
jobs -l
fg %<job-number>
```

- Hvis usikker tilstand: restart rent

```bash
pkill -f "tsx Backend/src/server.ts"
npm run start
```

## Verifikasjon etter fix

1. API svarer:

```bash
curl -i --max-time 3 http://127.0.0.1:3000/api/auth/me
```

2. Frontend går videre fra `Checking session...` til login eller app-view.

## Forebygging

- Kjør begge prosesser med `npm run dev` når mulig.
- Unngå `Ctrl+Z` på backend-prosessen; bruk `Ctrl+C` for kontrollert stopp.
- Hvis terminalen ble suspendert ved et uhell, bruk `fg` umiddelbart.
- `npm run start` rydder nå automatisk gamle/suspenderte backend-serverprosesser før ny oppstart (safe-start wrapper).

## Docs-impact policy (obligatorisk læringssløyfe)

Når denne feilen oppdages i et prosjekt, skal team/agent i samme endring:

- oppdatere relevant runbook og/eller guide
- oppdatere policy/checklist hvis eksisterende regler ikke fanget feilen
- dokumentere læringspunkt i `Compliance Summary` under `Docs-impact`
