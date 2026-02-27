# Skill: Data Modeling & Persistence

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-26

## Related skills

- `database-and-migrations.skill.md` (operativ migrasjonsdrift, deployrekkefølge, backup/restore)
- `clean-architecture.skill.md` (laggrenser, porter/adapters, transaksjonsansvar)

## Terminologi (standard)

- `schema` og `skjema` brukes synonymt; i ny tekst foretrekkes `skjema`.
- `forward-only` brukes som standard term for migrasjonsretning.
- `rollback` brukes kun om eksplisitt rollback-strategi; ellers foretrekkes korrigerende migrasjon.

## Mål

Designe persistensmodeller som er robuste, tydelige og enkle å evolvere uten å bryte domeneregler eller API-kontrakter.

Avgrensning:

- Denne skillen definerer modellvalg og persistensgrenser.
- Operativ deploy-/migrasjonsdrift styres av `database-and-migrations.skill.md`.

Denne skillen skal sikre konsistent praksis for:

- modellering av tabeller/entiteter
- invariants, constraints og indekser
- migrasjoner
- soft delete vs hard delete
- timestamps, audit og concurrency
- ID-strategi
- mapping mellom domain objects og persistence models

Optimaliseringsmål:

- korrekthet (invariants kan ikke brytes)
- endringsvennlighet (schema kan utvikles trygt)
- ytelse der det betyr noe (indekser og queries)
- sporbarhet (audit og timestamps)
- testbarhet (domain kan testes uten DB)

## Når den brukes

- Når nye tabeller/kolleksjoner/entiteter designes
- Når eksisterende schema endres
- Når migrasjoner legges til eller kjøres
- Når nye repositories eller queries etableres
- Når domain-objekter mappes til/fra persistence
- Når dataregler, constraints, indekser eller naming-konvensjoner justeres
- Når ID-strategi, delete-policy, audit eller concurrency-strategi endres

## Kjerneprinsipper

- Domain er sannhetskilde for forretningsregler (må aldri brytes)
- Database håndhever integritet eksplisitt (må aldri brytes)
- Schema-endringer skal være migrerbare og reversible (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Modeller for data, ikke tilfeldigheter
   - Hver tabell/entitet skal ha tydelig ansvar og eierskap.
   - Unngå polymorf/uklar modellering uten eksplisitt behov.
   - Én tabell skal ikke representere flere urelaterte konsepter.

2. Invariants håndheves i flere lag
   - Domain beskytter forretningsinvariants.
   - Database beskytter dataintegritet med `NOT NULL`, `CHECK`, `UNIQUE`, FK og riktige datatyper.
   - Kritiske regler skal ikke kun ligge i applikasjonskode.

3. Migrasjoner er eneste gyldige vei til schema-endring
   - Ingen manuell drift-endring uten migrasjon i repo.
   - Alle schema-endringer skal være versjonert og sporbare.
   - Hver migrasjon skal ha en eksplisitt rollback-strategi (faktisk rollback eller dokumentert forward-only med begrunnelse).

4. Mapping skjer ved laggrense
   - Domain objects skal ikke lekke tekniske persistence-felter.
   - Persistence-modeller skal ikke brukes direkte som domain-modeller.
   - Mapping skal være eksplisitt og testbar.

5. Design for endring, ikke perfeksjon
   - Unngå overgeneralisering (EAV eller "JSON for alt") uten dokumentert behov.
   - Normaliser som default; denormaliser først ved målt behov.

## Beslutninger som må tas eksplisitt

Følgende beslutninger skal tas og dokumenteres for nye eller vesentlig endrede modeller:

- ID-strategi (`UUID`/`ULID` vs `int`)
- delete-policy (soft vs hard delete)
- timestamps (`createdAt`, `updatedAt`, eventuelt `deletedAt`) og timezone (`UTC`)
- audit-policy (hva logges, hvor lagres det)
- concurrency-strategi (optimistic locking med `version` eller tilsvarende)
- naming conventions (tabeller, kolonner, foreign keys)
- indexing strategy (hvilke query-mønstre støttes)
- referential integrity (`FK`-constraints og `ON DELETE`-policy)

## Modellering av tabeller/entiteter

- Én tabell per aggregate root er default.
- Many-to-many modelleres med eksplisitte join-tabeller.
- Unngå "god tables" som samler urelatert ansvar.
- Start i domain: identifiser aggregate roots, invariants og relasjoner.
- Deretter design persistence-modell som støtter domain-operasjoner.
- Foretrekk eksplisitte kolonner over generiske JSON-felt for kjerneatferd.
- Bruk JSON/metadata-felt kun for virkelig ustrukturert data med klart eierskap.
- Navngivning skal være stabil, beskrivende og konsistent på tvers av schema og kode.

JSON-presisering:

- JSON-felt skal ha tydelig eier (f.eks. metadata for en spesifikk modul).
- JSON-felt skal ikke inneholde forretningskritiske invariants.
- JSON-felt skal ikke brukes for å unngå nødvendige migrasjoner.

Normalisering vs denormalisering:

- Default: normaliser data.
- Denormaliser kun ved målt eller tydelig observert query-behov.

## Aggregate boundary policy

- Én repository per aggregate root er default.
- Kryss-aggregate referanser skjer via ID, ikke direkte objektkobling.
- Transaksjonsgrenser følger aggregate root som utgangspunkt.
- FK mellom aggregates vurderes eksplisitt for å unngå hard kobling som bryter domenegrenser.

## Invariants, constraints og indekser

Må alltid vurderes per ny tabell/endring:

- `NOT NULL` for obligatoriske felter
- `UNIQUE` for naturlige nøkler (f.eks. normalisert e-post)
- `CHECK` for begrensede verdier/statusfelt
- FK for referensiell integritet
- indekser på vanlige filter/sort/join-kolonner

Operative regler:

- Ikke legg indeks på alle kolonner "for sikkerhets skyld".
- Hver indeks skal ha konkret query-case.
- Kompositt-indeks skal følge faktisk query-rekkefølge.
- Delvis/filtered indeks brukes når datamønster tilsier det (f.eks. aktive rader).

## Index policy (MUST/SHOULD)

- MUST: indeks på alle foreign keys.
- MUST: indeks på felter brukt i lookup (`email`, `slug`, `externalId`).
- SHOULD: komposittindeks for typiske query-filtre (`type + status + createdAt`).
- MUST: dokumenter hvorfor en indeks finnes (query-mønsteret den støtter).
- MUST NOT: legg til indekser "bare i tilfelle".

## ID-strategi (UUID vs int)

Standard for prosjektet:

- Bruk UUID som offentlig og intern primær-ID som default.

Begrunnelse:

- reduserer enumering-risiko mot sekvensielle ID-er
- enklere i distribuerte scenarier uten sentral sekvens
- tryggere ved dataflyt mellom miljøer/systemer

Unntak (krever dokumentert begrunnelse):

- ekstremt write-tunge tabeller med klare målinger som viser behov for annen strategi
- eksisterende legacy-tabeller der migrering er uforholdsmessig dyr

Hvis avvik fra UUID velges, skal beslutningen dokumenteres (og vurderes i ADR ved varig konsekvens).

## Timestamps, audit og concurrency

Minimum felter per muterbar entitet:

- `createdAt`
- `updatedAt`

Tidsregel:

- All tid lagres i `UTC`.
- `updatedAt` oppdateres kun ved faktisk dataendring.

Ved soft delete:

- `deletedAt` (null når aktiv)

Audit (minimum ved sikkerhets- eller forretningskritisk data):

- `createdBy` / `updatedBy` (hvis kontekst finnes)
- event-logg for kritiske tilstandsendringer

Audit-spor skal definere minst: hvem gjorde hva, og når.

Concurrency-regel:

- Bruk optimistic locking for entiteter med risiko for lost updates.
- Standard mekanisme: `version`-felt (eller equivalent `updatedAt`-sjekk når presisjon er tilstrekkelig og dokumentert).
- Konflikter skal gi eksplisitt feil (ikke silent overwrite).
- API/brukerrettet konflikt bør oversettes til `409 Conflict`.

## Soft delete vs hard delete

Default policy:

- Soft delete for bruker- og forretningskritiske entiteter.
- Hard delete for tekniske/ephemeral data uten revisjonsbehov.
- Hard delete kan brukes for testdata og GDPR-sletting via eksplisitt prosedyre.

Regler:

- Soft-deletede rader skal ekskluderes i standardlesing.
- Unikhetskrav må vurderes opp mot soft delete (f.eks. partial unique index for aktive rader).
- Hard delete på forretningskritisk data krever eksplisitt policy/ADR-vurdering.
- FK-strategi og query-policy skal forhindre "zombie data".

## Migrasjoner

Merk:

- Operativ migrasjonskjøring, deployrekkefølge, backup/restore og safety checks følger `database-and-migrations.skill.md`.

Migrasjoner skal være:

- små og fokuserte
- deterministiske
- idempotente i driftspipeline der mulig
- testbare i CI/lokalt
- forward-only som default (med mindre eksplisitt rollback-policy er etablert)
- inkludere datamigrering/backfill når schema-endring krever det

Sikker migrasjonssekvens for breaking endringer:

1. Expand: legg til nye kolonner/tabeller uten å fjerne gamle.
2. Backfill: migrer eksisterende data kontrollert.
3. Switch: oppdater applikasjonskode til ny modell.
4. Contract: fjern gamle felt først når bruk er borte.

Forbudt:

- schema-endring uten migrasjonsfil
- "big bang" rename/drop i samme deploy uten overgangsstrategi
- destruktive migrasjoner uten verifisert backup/rollback-plan

Produksjonssikkerhet:

- Destruktive migrasjoner krever dokumentert backup-verifisering før kjøring i produksjon.

## Repository- og query-regler (Clean Architecture)

- `domain`/`application` snakker med porter (f.eks. `UserRepository`), ikke ORM/DB direkte.
- DB-queries lever i `infrastructure`-laget.
- Repositories returnerer domain objects eller domain-vennlige DTO-er (avtales eksplisitt per port).
- ORM-typer skal ikke lekke til `application` eller `domain`.

MUST:

- Ingen DB/ORM-imports i `domain` eller `application`.
- Query-implementasjon ligger i `infrastructure`.

## Transaksjonspolicy

- Default: én use-case kjøres som én transaksjon.
- Kryss-aggregate operasjoner skal dokumentere transaksjonsgrense og konsistensstrategi eksplisitt.
- Partial commits er forbudt.
- Infrastruktur håndterer transaksjoner; `domain` skal ikke gjøre transaksjonsstyring.

## Query vs command (CQRS-light)

- Write-modell er aggregate-orientert og optimalisert for invariants.
- Read-modell kan optimaliseres separat for lesemønstre (projeksjoner/read DTO-er).
- CQRS-light skal ikke bryte laggrenser eller duplisere forretningsregler ukritisk.

## Mapping: domain objects vs persistence models

Regler:

- Domain representerer forretningsspråk og invariants.
- Persistence-modell representerer lagring, nøkler, tekniske metadata og normaliseringsbehov.
- Mapping-funksjoner skal være eksplisitte (ingen skjult magi i ORM-hooks alene).
- Mapping skal testes for både happy-path og ugyldige tilstander.
- DB-rader skal ikke passeres direkte inn i domain uten validering via constructor/factory.

Eksempel på grense:

- `User` (domain) inneholder kun meningsfulle felter for forretningslogikk.
- `UserRow` (persistence) kan i tillegg ha `version`, `deletedAt`, tekniske FK-er, audit-felter.

## Operativ arbeidsflyt

1. STEP 1: Definer domain-invariants og tilgangsmønstre
2. STEP 2: Design persistence-modell (tabeller, constraints, indekser)
3. STEP 3: Skriv migrasjon (expand-first ved risiko)
4. STEP 4: Implementer eksplisitt mapping ved laggrense
5. STEP 5: Verifiser med tester (mapping, constraints, migrasjonsflyt)
6. STEP 6: Vurder docs-impact og ADR-behov

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hva "bekreftelse" betyr

Gyldig bekreftelse:

- schema håndhever forventede constraints
- relevante queries bruker planlagte indekser
- migrasjon kan kjøres trygt i riktig rekkefølge
- mapping-tester passerer for kritiske felter/invariants

Ugyldig bekreftelse:

- "fungerer på min maskin" uten migrasjonsverifisering
- constraints kun i app-kode uten databasevern
- stilltiende overskriving ved concurrency-konflikter

## Regler (må/skal)

- Må: modellere ut fra domain-regler, ikke kun dagens UI-form.
- Må: definere constraints i database for kritisk integritet.
- Må: bruke migrasjoner for alle schema-endringer.
- Må: ha tydelig policy for soft/hard delete per entitetstype.
- Må: holde domain og persistence separert med eksplisitt mapping.
- Må: definere `ON DELETE`-policy eksplisitt for FK-relasjoner.
- Skal: foretrekke UUID som ID-standard.
- Skal: bruke optimistic locking der samtidige oppdateringer er realistiske.

## Feilhåndtering skal være konsistent

- Constraint-feil fra database oversettes til stabile applikasjonsfeil.
- Ikke lekk intern DB-feiltekst direkte til API-klient.
- Concurrency-konflikt skal signaliseres eksplisitt og håndteres deterministisk.
- Ikke swallow persistence-feil; logg trygt og returner korrekt feilkategori.

## Forskjell på "ny" og "endre"

Ny persistensstruktur:

- krever tydelig modell, constraints, indeksvurdering og migrasjon

Endring i eksisterende struktur:

- krever kompatibilitetsvurdering og plan for migrering av eksisterende data
- skal ikke maskeres som ren refaktor hvis data-/kontraktatferd påvirkes

## Docs Impact (obligatorisk)

Ved endring i data/persistens skal minst én av disse vurderes og oppdateres ved behov:

- API-kontrakt/spec (hvis respons/request eller semantikk påvirkes)
- arkitekturdokumentasjon (hvis laggrenser/ansvar endres)
- ADR (hvis varig policy-endring: ID-strategi, delete-policy, concurrency-strategi)

Hvis docs er uendret, skal dette begrunnes eksplisitt.

## Hard Stop-regel

Stopp og avklar hvis:

- du ikke kan uttrykke kritiske invariants som constraints og/eller domain-regler
- migrasjonsplan innebærer uakseptabel datarisiko uten rollback/backup-strategi
- valgt ID- eller delete-strategi avviker fra standard uten begrunnelse
- mapping mellom domain og persistence blir tvetydig eller skjuler forretningsregler
- schema-endring planlegges uten migrasjon
- ny constraint eller indeks foreslås uten begrunnelse
- delete-policy for entiteten er uklar
- timezone-strategi blir blandet/inkonsistent
- ORM-typer lekker over laggrense

## Forbudte handlinger

- Endre schema direkte i miljø uten migrasjon i repo
- Blande domain-objekter og persistence-modeller som samme type
- Legge forretningskritiske invariants kun i controller/use-case
- Bruke hard delete ukritisk på revisjonspliktige data
- Legge til indekser/constraints uten begrunnelse i tilgangsmønster
- Bruke EAV-skjema (key/value for alt) uten ekstremt godt dokumentert behov
- Bruke "JSON blob for alt" som default modellering
- Bruke generisk repository for alle entiteter uten tydelig gevinst
- Over-normalisere eller over-denormalisere før reelt behov
- Bruke "cascade delete everywhere" uten eksplisitt policy

## Anti-overengineering-regel

Følgende er ikke tillatt uten dokumentert behov:

- generisk "mega-repository" som skjuler konkret datamodell
- unødvendig komplekse polymorfe schemas
- tidlig sharding/partition-strategi uten reelle skalakrav
- avanserte audit-systemer når enkel event-logg dekker behovet

## Abstraksjonstest (før ny persistence-abstraksjon)

Før ny abstraksjon introduseres, svar:

- finnes minst to reelle backends/implementasjoner nå?
- reduserer abstraksjonen faktisk kobling eller testkostnad?
- er datamodellen fortsatt tydelig for utviklere uten ORM-spesialkunnskap?

Hvis nei, vent med abstraksjonen.

## Kvalitetskriterier

- Kriterium 1: Kritiske invariants håndheves i domain + database
- Kriterium 2: Migrasjoner er sporbare og trygge å kjøre
- Kriterium 3: Indekser er begrunnet i reelle spørringer
- Kriterium 4: Mapping er eksplisitt og testet
- Kriterium 5: Delete-, ID- og concurrency-strategi er konsekvent

## Performance sanity rule

- Modellering skal ta høyde for observerte query-mønstre og indekserbarhet.
- Operativ `EXPLAIN`-verifisering håndheves av `database-and-migrations.skill.md`.

## Teststrategi for persistence

- `domain`: tester uten DB
- `application`: use-case-tester med mockede repository-porter
- `infrastructure`: integrasjonstester mot faktisk DB (eller tilsvarende testmiljø)
- `migrations`: verifiser at `migrate up` fungerer i CI/lokalt

MUST:

- Minst én integrasjonstest per repository som gjør mer enn ren CRUD (kritisk query/mapping).

## Seeding og testdata (minimum)

- Dev/test-seeding skal være deterministisk.
- Testdata skal ikke ligge implicit i migrasjoner.
- Seeds skal ikke inneholde produksjonshemmeligheter.

## Granularitetsregel

Én endring bør normalt være liten:

- én entitet eller én tydelig schema-endring per syklus
- én migrasjon med klart formål
- lav risiko og enkel rollback-vurdering

## Definisjon av ferdig

En persistensendring er ferdig når:

- modell og constraints er eksplisitt definert
- migrasjon(er) er lagt til og verifisert
- mapping mellom domain og persistence er implementert og testet
- risiko rundt delete, ID og concurrency er vurdert og dokumentert
- docs-impact er håndtert i samme endring
- tester dekker domain + use-case + minst én relevant infra-integrasjonstest

## Operativ kontrakt for AI-agenter

Agenten skal alltid oppgi:

- hvilke tabeller/kolonner som endres
- hvilke constraints/indekser som legges til eller endres
- hvilken migrasjon som er laget
- hvordan mapping mellom domain og persistence skjer
- hvordan soft delete/hard delete håndteres i endringen
- hva som er testet (domain/use-case/infra/migrasjon)

## Senere fase (valgfritt)

Kan innføres når behov oppstår:

- data retention/GDPR-policy per datakategori
- avansert datalivssyklus per entitetstype

## Endringslogg

- 2026-02-26: Opprettet
- 2026-02-26: Supplert med beslutningsliste, index/migrasjonspolicy, repository-regler, testkrav og AI-kontrakt
- 2026-02-26: Supplert med aggregate boundary policy, transaksjonspolicy, CQRS-light, JSON-presisering, backup-krav, seeding-minimum og performance sanity rule
- 2026-02-26: Harmonisert ansvarsgrense mot database-and-migrations-skill (modellvalg vs operativ migrasjonsdrift)
- 2026-02-26: Lagt til Related skills for raskere navigasjon
