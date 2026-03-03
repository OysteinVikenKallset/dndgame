# Backlog

Last reviewed: 2026-03-02

Dette dokumentet samler prioriterte forbedringer som er bevisst utsatt fra MVP.

## B-001: Production-ready media storage

- **Status:** Planned
- **Priority:** High
- **MVP i dag:** Lokal disk-lagring i backend (`uploads/`)
- **Hvorfor backlog:** Lokal disk er sårbar i skalerte/multi-instance miljøer og gir svakere backup/retensjon.

### Mål (post-MVP)

- Innføre storage-abstraksjon (f.eks. `MediaStoragePort`) med minst to adapters:
  - lokal disk (dev/test)
  - S3-kompatibel bucket (prod)
- Sikre signerte URL-er eller kontrollert public access policy.
- Definere policy for filstørrelse, MIME allowlist, virus scanning og retention.

### Akseptansekriterier

- Produksjonsmiljø kan kjøre uten lokal disk-avhengighet.
- Upload/list/render fungerer likt via storage-abstraksjon.
- Dokumentert migrasjonssti fra lokal filsti til object storage.

## B-002: Database strategy for production rollout

- **Status:** Planned
- **Priority:** High
- **MVP i dag:** SQLite i lokal drift
- **Anbefalt prod-retning:** PostgreSQL
- **Hvorfor backlog:** SQLite er bra for MVP, men har begrensninger for concurrency, drift og operasjonell robusthet i produksjon.

### Mål (post-MVP)

- Etablere Postgres som primær produksjonsdatabase.
- Videreføre migrasjonsregime med samme kontrakter (schema + data constraints).
- Verifisere kompatibilitet for eksisterende use-cases, indekser og konflikt-håndtering.

### Akseptansekriterier

- Alle kritiske API-flyter passerer mot Postgres i CI.
- Migrasjonssekvens for miljøer er dokumentert i runbook.
- Ytelses- og driftsbaseline er definert (backup/restore, observability, failover-strategi light).
