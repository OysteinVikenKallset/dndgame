# Skill: Project Documentation System

## Metadata

- Owner: Engineering Team
- Stability: Stable
- Last reviewed: 2026-02-25

## Mål

Dokumentasjonen skal gjøre at:

- nye utviklere blir produktive raskt
- AI-agenter finner riktig informasjon uten å gjette
- regler og prinsipper følges i praksis
- kode og docs holdes synkronisert i hver endring

Dokumentasjon er en del av systemets kontrakt.

## Når den brukes

- Ved all ny funksjonalitet som påvirker kontrakter, arkitektur eller arbeidsflyt
- Ved endringer i policies (TDD, Clean Code, Clean Architecture, Auth)
- Ved PR-review (docs-impact sjekkes)
- Når ny konvensjon introduseres (doc-first)

## Kjerneprinsipper (må aldri brytes)

1. Docs er source of truth for konvensjoner og kontrakter
   - Hvis docs og kode er uenige: stopp og avklar før merge.

2. Docs skal være task-first
   - "Hvordan gjør jeg X?" skal være lett å finne før teori.

3. Én ting, ett sted
   - Ikke dupliser regler i flere filer.
   - Hvis noe må repeteres: lenk, ikke kopier.

4. AI skal kunne navigere docs deterministisk
   - Fast struktur, faste dokumenttyper og standard seksjoner.

5. Regler skal være håndhevbare
   - Viktige MUST-regler skal kobles til checklist, CI, lint eller tester.

## Doc Authority Hierarchy (konfliktregel)

Hvis dokumenter er i konflikt, gjelder denne prioriteten (høyest først):

1. ADR (`docs/adr/`)
2. API-spec/kontraktdokumentasjon (f.eks. `docs/user-auth-api-mvp-spec.md`)
3. Skills/policies (`docs/skills/`)
4. Guides (`docs/guides/`)
5. README/oversikter

Ved konflikt MUST arbeid stoppes til konflikten er avklart eller dokumentene er synkronisert.

## Standard språkpolicy (RFC-stil)

- MUST: absolutt krav
- MUST NOT: forbud
- SHOULD: sterk anbefaling
- MAY: valgfritt

Bruk disse termene eksplisitt i normative dokumenter.

## Docs Scope Boundary

Docs skal beskrive:

- regler
- kontrakter
- struktur
- beslutninger
- forventet atferd

Docs skal ikke beskrive:

- implementasjonsdetaljer som allerede er tydelige i kode
- midlertidige eksperimenter uten beslutningsverdi
- historikk uten operativ eller beslutningsmessig verdi

Hvis et dokument blir en linje-for-linje forklaring av kode, SHOULD dokumentet refaktoreres.

## Lesbarhetsstandard

Et dokument bryter standard hvis:

- hovedpoenget ikke kan forstås på ~2 minutter
- dokumentet mangler tydelige overskrifter
- dokumentet har lange, ustrukturerte tekstblokker

Tiltak ved brudd: refaktorer dokumentet (kortere seksjoner, punktlister, tydeligere struktur).

## Versjonsregel

Et dokument MUST versjoneres når:

- kontrakt brytes
- API endres inkompatibelt
- arkitekturregel endres

Versjonering kan gjøres via:

- filnavn (f.eks. `v1`, `v2`), eller
- header-metadata i dokumentet

## Doc Ownership Rule

Hvert kritiske dokument MUST ha en ansvarlig eier (person, rolle eller team).

- Eierskap SHOULD angis i dokumentheader eller metadata.
- Eierskap MUST oppdateres ved team-/ansvarsendringer.

## Doc Stability Levels

Dokumenter SHOULD merkes med stabilitetsnivå når relevant:

- `Stable`: etablert og forventes sjelden endret
- `Evolving`: aktivt vedlikeholdt og under kontinuerlig forbedring
- `Experimental`: midlertidig/utforskende og ikke endelig standard

Eksperimentelle docs MUST merkes eksplisitt for å unngå feil bruk som permanent regelverk.

## Kritiske docs (definisjon)

Følgende regnes som kritiske docs:

- arkitektur
- auth
- API-kontrakter
- sikkerhetsregler
- datamodell

## Minimum struktur i repo

- `docs/README.md`: startpunkt og beslutningstre
- `docs/skills/`: normative regler og policies
- `docs/reference/`: glossary, conventions, project-map og kontraktreferanser
- `docs/guides/`: steg-for-steg how-to
- `docs/decisions/`: ADR-indeks/peker til beslutninger
- `docs/runbooks/`: feilsøking og operasjon
- `docs/agents/`: agent-kontrakt og agent-checklist

Eksisterende domene-/arkitekturdocs kan beholdes, men må lenkes fra `docs/README.md`.

## Strukturregler

- Én kilde per tema (unngå duplikate sannheter på tvers av filer)
- Kortfattet tekst med tydelige overskrifter og punktlister
- Ny fil opprettes kun når eksisterende fil ikke dekker temaet naturlig
- Nye docs må registreres i `docs/README.md` (og `docs/skills/README.md` for skills)
- Dokumentnavn SHOULD være semantiske og søkbare (f.eks. `auth-session-strategy.md`, ikke `notes.md`)

## Fast mal per dokument (AI-vennlig)

Hver ny normativ doc SHOULD inneholde:

- Purpose
- Scope
- When to use
- Rules (MUST/SHOULD/MUST NOT)
- Examples
- Good vs Bad
- Checklist
- Related docs
- Change log

## Dokumenttyper (hva hører hvor)

- Guide: how-to steg-for-steg
- Reference: eksakte kontrakter, statuskoder, mapping, begreper
- Policy/Skill: MUST/SHOULD-regler
- ADR: hvorfor en beslutning ble tatt
- Runbook: hva gjøres når noe feiler i CI/prod

Guide og reference MUST NOT blandes i samme dokument.

## Docs-to-code håndheving

### PR-sjekkliste (obligatorisk)

- Hvilke docs påvirkes?
- Brytes noen MUST-regler?
- Endret kontrakter (API/DTO)?
- Trenger endringen ADR?

### CI og guardrails (obligatorisk minimum)

- docs-guard for kode->docs synk og skill-indeksoppdateringer
- lint av import boundaries
- testkrav/TDD-flyt
- coverage policy
- kontrakttester der relevant

### Automatisk docs-guard (obligatorisk)

Repoet håndhever automatisk følgende:

- Hvis `src/**/*.ts` endres, må minst én fil i `docs/` endres i samme endringssett.
- Hvis ny `docs/skills/*.skill.md` legges til, må disse også oppdateres:
  - `docs/skills/README.md`
  - `docs/README.md`

Håndheving skjer i:

- pre-commit (`npm run docs:guard`)
- CI (`npm run docs:guard:ci`)

Feilsøking: se `docs/guides/docs-guard-failures.md`.

### Agent contract

I `docs/agents/` skal det finnes:

- korte operating rules
- stop conditions
- required outputs (inkludert hvilke docs agenten fulgte)

## Docs debt og freshness policy

- Hvis kontrakter/struktur endres uten docs-oppdatering i samme PR: PR MUST NOT merges.
- Docs MUST oppdateres i samme commit eller PR som kodeendringen.
- Docs MUST NOT oppdateres i separat PR, med mindre endringen er en ren docs-fix.
- Kritiske docs MUST ha `Last reviewed: YYYY-MM-DD`.
- Kritiske docs (auth, api, architecture) SHOULD revideres minst hver 3.-6. måned.

## Interpretation Rule

Hvis en regel kan tolkes på flere måter, skal den strengeste tolkningen brukes.

## Docs Drift Detection

Hvis en utvikler/agent oppdager at docs er utdaterte, feil eller mangler, skal vedkommende:

1. stoppe og markere docs-drift i PR/arbeidslogg
2. oppdatere docs i samme endring, eller
3. opprette eksplisitt oppgave med tydelig eierskap dersom oppdatering ikke kan gjøres umiddelbart

Drift MUST NOT ignoreres.

## Regler (MUST/SHOULD/MUST NOT)

- MUST oppdatere relevante docs i samme endring som kode.
- MUST oppdatere ADR ved varige arkitektur- eller sikkerhetsbeslutninger.
- MUST beskrive docs-impact i PR.
- MUST NOT lagre essensiell info kun i Slack/Notion.
- SHOULD legge normative regler i `docs/skills/`.
- SHOULD bruke filnavnkonvensjonen `*.skill.md` for nye skills.

## Operativ kontrakt for AI-agenter

Agenten skal:

- identifisere hvilke docs som er relevante før implementasjon
- lese relevante docs før implementasjon
- starte i `docs/README.md` og følge decision tree
- eksplisitt liste hvilke docs som ble fulgt
- stoppe ved uklare/motstridende docs
- stoppe hvis nødvendig informasjon mangler
- foreslå docs-endring ved ny konvensjon
- ikke endre arkitektur/auth-kontrakter uten ADR
- oppdatere relevant doc i samme endring som kode

## Docs Anti-Patterns

Unngå følgende anti-patterns:

- docs som beskriver ønsket fremtid i stedet for faktisk system
- docs som kopierer kode uten kontraktsverdi
- docs som motsier hverandre
- docs uten dato (`Last reviewed`)
- docs uten tydelig struktur (overskrifter/sjekklister)

## Hard Stop-regler (Docs)

Stopp hvis:

- en MUST-regel brytes
- docs og kode er i konflikt
- ny konvensjon introduseres uten docs/ADR
- relevant doc ikke finnes (opprett eller foreslå)

## Definition of Done (Docs-system)

Docs-systemet er "ferdig" når:

- `docs/README.md` har tydelig entrypoint + decision tree
- skills/policies ligger i `docs/` og er lenket
- PR-sjekkliste finnes og brukes
- sentrale MUST-regler håndheves av guardrails
- nye utviklere kan følge quickstart
- AI-agenter har agent-contract og stop conditions

## Endringslogg

- 2026-02-24: Opprettet
- 2026-02-24: Utvidet med authority hierarchy, scope boundary, lesbarhetsstandard, versjonsregel og drift detection
- 2026-02-24: Utvidet med ownership rule, stability levels, kritiske docs-definisjon, latency/interpretation-regler og docs anti-patterns
- 2026-02-25: La til automatisk docs-guard for kode->docs synk og obligatoriske indeksoppdateringer ved nye skills
