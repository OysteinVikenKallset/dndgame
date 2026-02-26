# Skill: Database & Migrations

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-26

## Related skills

- `data-modeling-persistence.skill.md` (modellvalg, constraints-design, mapping)
- `clean-architecture.skill.md` (laggrenser, porter/adapters, transaksjonsansvar)

## Terminologi (standard)

- `schema` og `skjema` brukes synonymt; i ny tekst foretrekkes `skjema`.
- `forward-only` brukes som standard term for migrasjonsretning.
- `rollback` brukes kun om eksplisitt rollback-strategi; ellers foretrekkes korrigerende migrasjon.

## Mål

Sikre trygg, sporbar og reverserbar database-evolusjon over tid.

Databasestruktur, migrasjoner og dataoperasjoner skal være:

- trygge å deploye
- reversible eller kontrollerbare
- sporbare
- konsistente mellom miljøer
- testbare
- robuste mot feil og data-tap

Denne skillen styrer drift- og endringspraksis for:

- migrasjonspolicy (forward-only og rollback-policy)
- seed-data policy
- transaksjonsregler
- test-database strategi
- backup/restore (light)

Skillen supplerer `data-modeling-persistence.skill.md`:

- Data Modeling & Persistence: hva modellen skal være
- Database & Migrations: hvordan modellen endres trygt i drift over tid

Avgrensning:

- Modellvalg (entitetsstruktur, constraints-design, mapping) styres av `data-modeling-persistence.skill.md`.
- Denne skillen styrer operativ evolusjon og driftssikker migrasjonsgjennomføring.

Definisjon:

- Produksjonslignende miljø = samme DB-motor, samme versjon, samme extensions og samme migrasjonskjede som produksjon.

## Når den brukes

- Når schema endres via migrasjoner
- Ved deploy til miljøer med database
- Når migrasjonsverktøy, rekkefølge eller strategi endres
- Når seed-data legges til eller oppdateres
- Når transaksjonsgrenser påvirkes av DB-endring
- Når testmiljø for database (container/sqlite/in-memory/ekte DB) velges eller justeres
- Når backup/restore-prosedyrer vurderes for destruktive endringer
- Ved database-feil eller restore-scenarioer

## Kjerneprinsipper

- Migrasjoner er eneste source of truth for schema-evolusjon (må aldri brytes)
- Endringer skal være trygge å kjøre i produksjonslignende flyt (må aldri brytes)
- Driftssikkerhet trumfer hastverk (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Ingen manuelle schema-endringer i drift
   - All schema-endring skal inn som migrasjon i repo.
   - Ingen "quick fix" direkte i database uten etterfølgende migrasjon er tillatt.

2. Forward-only som default
   - Migrasjoner skal planlegges som forward-only.
   - Rollback håndteres primært via ny korrigerende migrasjon.
   - Hvis fysisk rollback-script brukes, må det være testet og dokumentert.

3. Destruktive endringer krever ekstra sikkerhet
   - Drop/rename/destruktive dataendringer krever expand -> backfill -> switch -> contract.
   - Backup-verifisering skal være dokumentert før destruktive steg i prod.

4. Testbar drift
   - Migrasjoner og seed skal kunne kjøres deterministisk i test/CI.
   - Feil i migrasjon skal oppdages før produksjon.

5. Databasen er en tilstandsmaskin
   - Schema + data representerer systemets reelle tilstand.
   - Ugyldige tilstander skal ikke introduseres via deploy/migrasjon.

6. Schema utvikles sekvensielt
   - Databasen skal kunne migreres fra tidligere versjon til ny versjon.
   - Migrasjonskjeden skal være sammenhengende og sporbar.

7. Deploy skal være trygt å kjøre flere ganger
   - Migrasjonsprosessen skal være deterministisk.
   - Gjentatte kjøringer i samme state skal ikke gi ukontrollert sideeffekt.

## Migrasjonspolicy

### Migrasjonsklassifisering

- Additiv migrasjon: legger til struktur uten å bryte eksisterende bruk.
- Transformerende migrasjon: flytter/omformer data og krever kontrollert dataflyt.
- Destruktiv migrasjon: kan gi permanent datatap eller uopprettelig strukturendring.

Destruktiv migrasjon skal alltid behandles som høy-risiko endring.

MUST:

- Én tydelig hensikt per migrasjon.
- Migrasjoner skal være deterministiske og kjøre i fast rekkefølge.
- Datamigrering/backfill skal inngå når schema-endring krever det.
- Migrasjonsfilnavn skal gjøre rekkefølge og formål tydelig.
- Migrasjoner skal ikke avhenge av lokal utviklermaskin-tilstand.

SHOULD:

- Hold migrasjoner små for enklere feilsøking og lavere risiko.
- Foretrekk additive steg før destruktive steg.

MUST NOT:

- Kombinere store schema-endringer og stor forretningslogikk i samme deploy uten overgangsplan.
- Droppe kolonner/tabeller direkte uten dokumentert kontraksjonsfase.
- Kjøring som antar tom database.
- Migrasjoner som leser runtime config for å bestemme schema-atferd.

## Breaking changes strategi (obligatorisk)

Alle breaking schema-endringer skal følge:

Expand -> Backfill -> Switch -> Contract

Dette betyr:

- legg til ny struktur (felt/tabell)
- migrer eksisterende data
- oppdater applikasjonskode
- fjern gammel struktur når den ikke lenger er i bruk

Forbudt i breaking-flyt:

- rename + drop i samme deploy

## Migrasjonskvalitet

En migrasjon er god når:

- den kan kjøres i staging uten feil
- den kan kjøres på kopi av prod-data
- den ikke låser tabeller unødvendig lenge
- den ikke skalerer lineært med datamengde uten dokumentert begrunnelse

## Rollback-policy

Default policy:

- Forward-only i produksjon.

Når rollback trengs:

- Bruk korrigerende migrasjon som førstevalg.
- Bruk fysisk rollback kun når risiko er vurdert, script er testet, og restore-plan er dokumentert.

Krav ved rollback-strategi:

- Definer tydelig "point of no return" i deploy-flyten.
- Dokumenter hvilke data som kan tapes eller krever re-prosessering.

## Seed-data policy

Avgrensning:

- Seed = baseline-data for utvikling/test/demo.
- Fixtures = scenario-data for spesifikke tester.

MUST:

- Seed for dev/test skal være deterministisk.
- Seed-data skal være idempotent der mulig.
- Seed-skript skal være separert fra migrasjoner.
- Seed skal ikke inneholde produksjonshemmeligheter eller ekte persondata.

SHOULD:

- Ha liten "baseline seed" for lokal oppstart.
- Ha scenario-seeds for integrasjonstester der det gir verdi.

MUST NOT:

- Legge testfixtures skjult i migrasjoner.
- Kreve manuelle steg for å få konsistent testdata uten dokumentasjon.

## Transaksjonsregler

- Én use-case skal normalt mappe til én transaksjon.
- Infrastruktur/adapters håndterer transaksjonskontroll.
- Domain skal ikke håndtere commit/rollback.
- Partial commits er forbudt for én forretningsoperasjon.
- Kryss-aggregate transaksjon eller eventual consistency skal dokumenteres eksplisitt.
- Transaksjoner skal avsluttes deterministisk.

## Concurrency og locking

- Ved samtidige writes brukes optimistic locking som default.
- Pessimistic locking brukes kun ved målt behov.
- Hvis write-konflikter forventes hyppig, vurder designendring før pessimistic locking.
- Konflikter skal aldri overskrive stille.
- Konflikter skal alltid gi eksplisitt feil.

## Test-database strategi

Mål: riktig tillitsnivå per testlag, med lavest mulig kostnad.

Policy:

- `domain`: ingen DB (rene enhetstester)
- `application`: mockede porter (ingen DB)
- `infrastructure`: faktisk DB-adapter testes mot database

Valg av DB-strategi i infrastructure-tester:

1. Foretrukket: container med samme DB-type som produksjon
2. Lokal ephemeral DB
3. In-memory DB (kun for raske tester)
4. SQLite-fallback

Ikke tilstrekkelig alene:

- in-memory fake når SQL-funksjoner, constraints eller transaksjonsatferd er viktige

MUST:

- Minst én CI-testbane skal kjøre migrasjoner mot faktisk DB-motor (eller produksjonslik kompatibel motor).
- Kritiske repository-queries verifiseres i integrasjonstest.

## Backup/restore (light)

Før destruktive migrasjoner i produksjon:

- Bekreft at gyldig backup er tatt.
- Verifiser at restore-prosedyre er dokumentert og testet i rimelig grad.
- Avklar ansvar og tidsvindu for restore.

Minimum dokumentasjon:

- hvor backup finnes
- hvor lenge backup lagres
- hvordan restore initieres
- forventet RTO/RPO-nivå (light estimat)

## Migration Safety Checklist (før deploy)

Minstekontroll for migrasjoner med moderat/høy risiko:

- påvirker endringen mer enn ca. 10k rader?
- kan endringen låse tabeller i kritisk tidsrom?
- krever endringen reindex eller etterarbeid?
- kan endringen kjøres online uten nedetid?
- hva er worst-case runtime i produksjonslignende miljø?

## Deploy-regler

Deploy skal:

- kjøre migrasjoner før applikasjonskode aktiveres
- stoppe ved migrasjonsfeil
- ikke starte app med inkonsistent schema
- sikre at schema-endringer er backward compatible med minst én tidligere appversjon under deploy-vinduet

Deploy MUST NOT:

- ignorere migrasjonsfeil
- skippe migrasjoner i enkelte miljøer

## Tidsbasert risikoregel

- Risikofylte migrasjoner skal kjøres i planlagt deploy-vindu, ikke ad hoc i høylastperioder.

## Query plan-regel

- Nye ikke-trivielle queries skal verifiseres med `EXPLAIN`-plan i produksjonslignende miljø.

## Operativ arbeidsflyt

1. STEP 1: Klassifiser endringen (additiv, datamigrering, destruktiv)
2. STEP 2: Velg strategi (forward-only, expand/backfill/switch/contract)
3. STEP 3: Skriv migrasjon + eventuelt seed/backfill-script
4. STEP 4: Test migrasjon lokalt
5. STEP 5: Test migrasjon på staging-data eller produksjonslik kopi
6. STEP 6: Deploy migrasjon, deploy kode, verifiser systemtilstand og dokumenter risiko/docs-impact

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hva "bekreftelse" betyr

Gyldig bekreftelse:

- migrasjoner kjører i riktig rekkefølge uten manuelle inngrep
- schema/data etter migrasjon matcher forventning
- kritiske queries passerer mot faktisk DB-adapter
- destruktive steg har dokumentert backup/restore-forutsetning

Ugyldig bekreftelse:

- kun lokal kjøring mot fake/in-memory uten reell DB-verifisering
- migrasjon valideres uten data-cases som faktisk påvirkes
- rollback/restore antas uten dokumentert prosedyre

## Regler (må/skal)

- Må: bruke migrasjoner for alle schema-endringer.
- Må: holde seed-data separert fra migrasjoner.
- Må: dokumentere strategi for destruktive endringer.
- Må: bruke riktig testnivå for databasekritisk atferd.
- Skal: foretrekke forward-only med korrigerende migrasjoner.
- Skal: holde migrasjoner små og isolerte.

## Feilhåndtering skal være konsistent

- Migrasjonsfeil skal stoppe pipeline/deploy automatisk.
- DB-feil under migrasjon skal logges med nok teknisk kontekst for feilsøking.
- Feil skal ikke "swallowes"; de skal eskaleres og håndteres eksplisitt.
- Recovery-plan (retry, korrigerende migrasjon, restore) skal velges og dokumenteres.

## Forskjell på "ny" og "endre"

Ny migrasjon:

- introduksjon av ny schema/data-endring i versjonert form

Endring av eksisterende migrasjon:

- er forbudt etter at migrasjonen er kjørt i delt miljø
- skal løses med ny korrigerende migrasjon

## Hard Stop-regel

Stopp og avklar hvis:

- schema-endring foreslås uten migrasjon
- destruktiv migrasjon mangler backup/restore-plan
- forward-only/rollback-strategi er uklar
- teststrategi bruker kun in-memory for DB-kritisk atferd
- seed-policy bryter med sikkerhet eller determinisme
- transaksjonsgrenser er uklare og kan gi partial commits
- migrasjon ikke er praktisk migrerbar fra tidligere versjon
- migrasjonstid er uakseptabel for planlagt deploy-vindu
- dataformat endres uten eksplisitt migreringsstrategi
- prod-data ikke kan restore-testes i rimelig grad

## Forbudte handlinger

- Endre prod-schema manuelt uten sporbar migrasjon i repo
- Redigere allerede deployet migrasjon for å "fikse historikk"
- Blande seed/testdata inn i ordinære migrasjoner
- Kjøre destruktive migrasjoner uten backup-verifisering
- Basere DB-korrekthet kun på unit-tester uten integrasjon mot DB-adapter
- Hotfix-SQL i produksjon uten commit i repo
- Deploy uten migrasjonssjekk

## Anti-overengineering-regel

Følgende er ikke tillatt uten dokumentert behov:

- avansert migrasjonsorkestrering for enkel schema-endring
- flere test-DB-oppsett som vedlikeholdes uten tydelig verdi
- komplekse rollback-mekanismer når korrigerende migrasjon er tilstrekkelig

## Kvalitetskriterier

- Kriterium 1: Endringen er fullt sporbar via migrasjoner
- Kriterium 2: Risiko for produksjon er vurdert og mitigert
- Kriterium 3: Testnivå matcher DB-risiko (inkludert faktisk DB ved behov)
- Kriterium 4: Seed-data er trygg, deterministisk og separat
- Kriterium 5: Transaksjons- og recovery-policy er eksplisitt
- Kriterium 6: Schema er konsistent i alle miljøer
- Kriterium 7: Ingen datatap oppstår i planlagt migrasjonsflyt

## Definisjon av ferdig

En database/migrasjonsendring er ferdig når:

- migrasjon(er) er lagt til og verifisert
- eventuelle backfill/seed-skript er på plass
- tester kjører på riktig nivå og passerer
- backup/restore-krav er håndtert for destruktive endringer
- docs-impact er vurdert og oppdatert
- deploy-rekkefølge er verifisert (migrasjon før app-aktivering)

## Operativ kontrakt for AI-agenter

Agenten skal alltid oppgi:

- hvilke migrasjoner som er lagt til
- hvilke schemaendringer som gjøres
- om endringen er additiv/safe eller breaking
- valgt strategi (forward-only, korrigerende migrasjon, ev. rollback)
- hvordan seed/backfill håndteres
- hvordan data påvirkes
- hvilken DB-teststrategi som er brukt
- hvilke tester som ble kjørt
- hvilke risikoer og stop conditions som finnes

Agenten skal stoppe hvis ett av punktene over er uklart.

## Senere modenhetsnivå

Kan innføres senere:

- online schema migrations
- zero-downtime deploys
- read replicas
- migration linting
- automatic migration verification

## Endringslogg

- 2026-02-26: Opprettet
- 2026-02-26: Supplert med state-machine-prinsipp, deploy-regler, concurrency/locking, migrasjonskvalitet og modenhetsnivå
- 2026-02-26: Supplert med produksjonslignende miljø-definisjon, migrasjonsklassifisering, seed-vs-fixtures, safety checklist, kompatibilitetskrav og query-plan-regel
- 2026-02-26: Harmonisert ansvarsgrense mot data-modeling-persistence-skill
- 2026-02-26: Lagt til Related skills for raskere navigasjon
