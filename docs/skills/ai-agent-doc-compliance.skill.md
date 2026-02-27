# Skill: AI Agent Doc Compliance

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-25

## Mål

Sikre at AI-agenter konsekvent:

- følger prosjektets definerte skills og regler
- bruker dokumentasjon som autoritativ kilde
- ikke introduserer uautoriserte mønstre eller arkitektur
- stopper når krav eller regler er uklare
- leverer verifiserbar, trygg og forklarbar kode

Denne skillen definerer hvordan AI skal arbeide, ikke hva systemet gjør.

## Når den brukes

- Ved enhver AI-generert kode, forslag eller endring
- Ved analyse av eksisterende kode
- Ved refaktorering
- Ved arkitekturendringer
- Ved forslag til nye mønstre eller strukturer
- Ved docs-endringer som påvirker regler/kontrakter

Denne skillen gjelder alltid når AI bidrar til prosjektet.

## Kjerneprinsipper

- Skills styrer implementasjon (må aldri brytes)
- Docs er autoritativ sannhet (må aldri brytes)
- Deterministisk arbeidsflyt (må aldri brytes)
- Forklarbarhet i beslutninger (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Agenten må etablere dokumentgrunnlag før endring
   - Relevante docs må identifiseres og leses før første kodeedit.
   - Minstekrav: relevant skill + kontraktdoc/spec + eventuelle ADR-er.

2. Konflikter og hull i docs er hard stop
   - Hvis docs er motstridende, utdaterte eller uklare for oppgaven: stopp og avklar.
   - Agenten skal ikke gjette policy eller kontrakt.

3. Leveransen må inneholde etterlevelsesbevis
   - Agenten må eksplisitt angi hvilke docs/regler som styrte valgene.
   - Agenten må beskrive hva som ble verifisert (lint/test/build) når relevant.

4. Skill Selection Rule (obligatorisk)
   - Før implementasjon MUST agenten identifisere hvilke skills som gjelder.
   - Hvis relevante skills ikke kan identifiseres, skal agenten stoppe og avklare.

Eksempler på skill-valg:

- ny funksjonalitet -> TDD + Clean Code
- strukturendring -> Clean Architecture
- endpoint/endring i auth-flyt -> User/Auth API skill + API-spec
- nye docs/prosessregler -> Project Documentation System

## Pre-Execution Protocol (obligatorisk)

Før kode skrives må agenten:

1. identifisere relevante skills
2. lese relevante docs
3. identifisere constraints
4. identifisere risiko
5. bekrefte forståelse av oppgaven

Hvis ett punkt mangler, skal agenten stoppe.

## Operativ arbeidsflyt

1. STEP 1: Klassifiser oppgaven
   - Bestem om oppgaven gjelder kontrakt, sikkerhet, arkitektur, implementasjon eller docs.

2. STEP 2: Finn normative docs
   - Start i `docs/README.md` og følg decision tree.
   - Les relevante skills i `docs/skills/`.
   - Les kontraktdocs (f.eks. API-spec) og ADR ved behov.

3. STEP 3: Lag regelkart (rule map)
   - Mapp hvert eksplisitt krav i oppgaven til relevante MUST/SHOULD-regler.
   - Marker hva som er ikke-forhandlingsbart (MUST/MUST NOT).

4. STEP 4: Implementer minste sikre endring
   - Gjør minimal endring som tilfredsstiller krav + regler.
   - Unngå scope creep og hypotetiske forbedringer.

5. STEP 5: Verifiser objektivt
   - Kjør relevante kontroller (lint/test/build) eller tilsvarende docs-verifisering.
   - Bekreft at kontrakt og docs fortsatt er synkronisert.

6. STEP 6: Lever med etterlevelsesrapport
   - Oppgi hva som ble endret.
   - Oppgi hvilke docs/regler som ble fulgt.
   - Oppgi hva som er verifisert og eventuelle avvik/risiko.

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Compliance Loop før levering

Før levering skal agenten verifisere:

- bryter løsningen en MUST-regel?
- bryter løsningen dependency rule?
- introduseres ny konvensjon/mønster?
- finnes en enklere løsning?
- er løsningen minimal?

Hvis ett svar er usikkert, skal agenten stoppe og be om avklaring.

## Verification Hierarchy (fast rekkefølge)

Ved kodeendring skal verifisering skje i denne rekkefølgen:

1. TDD-tester (ny atferd)
2. Skill-regler (MUST/MUST NOT)
3. Dependency rule
4. Docs-impact
5. CI/lint/build

Rekkefølgen er deterministisk og skal ikke hoppes over.

## Mandatory Reasoning Output

Agenten skal eksplisitt oppgi:

- hvilke skills som ble brukt
- hvilke regler som påvirket løsningen
- hvilke antagelser som ble gjort
- hvilke risikoer som finnes

Dette skal skje før eller sammen med implementasjon.

Fast rapportformat:

```text
Compliance Summary:
- Relevant skills:
- MUST-regler påvirket:
- Antagelser:
- Risiko:
- Docs-impact:
- Verifisering:
```

## Docs Impact (obligatorisk)

- Agenten må alltid vurdere docs-impact før avslutning.
- Hvis kodeendring påvirker kontrakt/policy, skal docs oppdateres i samme endring.
- Hvis docs ikke oppdateres, skal begrunnelse gis eksplisitt i leveransen.

## Hard Stop-regel

Agenten skal stoppe og avklare ved:

- uklare eller motstridende krav
- konflikt mellom docs og kode
- konflikt mellom to normative docs
- manglende relevant skill eller policy
- manglende policy for sikkerhetskritisk beslutning
- risiko for at sikkerhet påvirkes negativt
- arkitekturvalg som mangler dokumentert grunnlag/ADR-vurdering

Ved hard stop skal agenten:

- forklare problemet
- peke på manglende informasjon
- foreslå konkret avklaring eller neste spørsmål

## Escalation Rule

Hvis hard stop ikke kan avklares innen rimelig kontekst, skal agenten eskalere ved å foreslå én av:

- konkret policy-tillegg i docs
- eksplisitt ny skill
- ADR-utkast

Målet er å gjøre systemet evolusjonært i stedet for blokkert.

## Skill Authority Rule

- Hvis skill og kode er i konflikt, gjelder skillen.
- Hvis to skills er i konflikt, brukes Doc Authority Hierarchy fra docs-systemet.

## Implicit Knowledge Rule

Prosjektets docs overstyrer generell bransjepraksis.

Hvis prosjektregel og "best practice" er i konflikt, gjelder prosjektregelen.

## Kompleksitetsindikatorer

Løsningen må forenkles hvis ett eller flere signaler oppstår:

- > 2 nye abstraksjoner uten tydelig behov
- > 1 nytt ansvar i samme endring
- > 3 filer endres for en enkel atferdsendring uten klar begrunnelse
- implementasjonen krever omfattende forklaring for å forstå basisflyt

## Kognitiv belastning

Skillen skal holde arbeidsflyten sekvensiell og lett:

- én beslutning av gangen (docvalg -> regelkart -> endring -> verifisering)
- eksplisitt navngivning av regler som styrer valg
- kort, tydelig rapportering av hva som er gjort og verifisert

## Hva "bekreftelse" betyr

Gyldig bekreftelse:

- relevante docs er lest og brukt aktivt i beslutningene
- implementasjon matcher kontrakt og MUST-regler
- relevante kontroller er grønne (når kode er endret)

Ugyldig bekreftelse:

- kun "det ser riktig ut" uten test/kontroll
- henvisning til docs uten konkret anvendelse
- ignorering av konflikt mellom docs

## Regler (MUST / MUST NOT)

MUST:

- følge relevante skills før kode skrives
- validere løsningen mot regler før levering
- stoppe ved usikkerhet eller regelkonflikt
- prioritere enkelhet og minimal endring
- forklare beslutninger og etterlevelse

MUST NOT:

- ignorere docs
- gjette krav
- skrive kode før pre-execution protocol er fullført
- introdusere skjulte sideeffekter
- overengineere

## Feilhåndtering skal være konsistent

- Feil i forutsetninger (uklare krav/docs-konflikt) håndteres med stopp + avklaring.
- Feil i implementasjon håndteres med korrigering + ny verifisering.
- Det er forbudt å "swallow" policy-feil ved å fortsette uten avklaring.

## Forskjell på "ny" og "endre"

Ny oppførsel:

- krever eksplisitt krav + relevant kontrakt + tester/verifisering

Endring i eksisterende oppførsel:

- krever begrunnelse og kontroll mot gjeldende docs/kontrakt
- skal ikke maskeres som "refaktor" hvis observerbar atferd endres

## Forbudte handlinger

- implementere før relevante docs er lest
- overse MUST-regler fordi løsningen virker enklere
- endre kontrakt uten docs/ADR-vurdering
- avslutte uten verifiserbar etterlevelsesrapport

## Introduksjon av nye mønstre

Agenten MUST NOT introdusere:

- nye arkitekturmønstre
- nye abstraheringslag
- nye designmønstre
- nye teknologivalg

uten:

- eksplisitt behov
- dokumentert begrunnelse
- ADR-vurdering der nødvendig

## Antagelsesregel

Agenten skal ikke anta:

- implisitte krav
- skjulte regler
- ønsket arkitektur
- teknologivalg

Hvis noe ikke er spesifisert, skal agenten avklare.

## Determinisme-regel

Samme input + samme docs skal gi samme beslutning.

Agenten skal ikke:

- improvisere arkitektur
- optimalisere for hypotetiske krav
- være kreativ med systemkontrakter uten eksplisitt behov

## Non-Ambiguity Rule

Hvis to tolkninger er mulig, velg den som:

- bryter færrest regler
- introduserer minst kompleksitet
- er mest reversibel

## Anti-overengineering-regel

Følgende er ikke tillatt uten eksplisitt behov:

- nye rammeverk/lag for en enkel oppgave
- generiske policy-motorer
- hypotetiske "fremtidssikringer" uten krav

## Abstraksjonstest (før ny abstraksjon)

Før ny abstraksjon introduseres, svar ja på minst to:

- brukes av minst to konkrete flyter?
- reduserer kompleksitet i dagens oppgave?
- gjør etterlevelse enklere å verifisere?

Hvis nei, vent med abstraksjonen.

## Kvalitetskriterier

- Kriterium 1: Relevante docs identifisert og brukt før endring
- Kriterium 2: Endring følger MUST-regler uten unntak
- Kriterium 3: Verifisering er gjennomført og rapportert
- Kriterium 4: Docs og kode er synkronisert etter endring
- Kriterium 5: Ingen scope creep utover brukerforespørsel

## Granularitetsregel

Én syklus skal være liten nok til at:

- hensikt og konsekvens er enkel å forstå
- verifisering kan kjøres raskt
- risiko er lav og avgrenset

## Scope Freeze Rule

Agenten skal ikke:

- forbedre nærliggende kode utenfor oppgaven
- refaktorere urelaterte områder
- justere naming uten eksplisitt grunn

med mindre det er nødvendig for regeloverholdelse.

## Tillatt vs ikke tillatt forbedring

Tillatt:

- tydeligere struktur for bedre etterlevelse
- fjerne unødvendig kompleksitet
- docs-synk for faktisk implementert atferd

Ikke tillatt:

- skjult funksjonsutvidelse
- kontraktsendring uten eksplisitt krav
- policy-endring uten relevant doc/ADR

## Vanlige AI-feil denne skillen skal forhindre

- implementerer løsning uten å lese regler
- lager generiske abstraksjoner uten behov
- skriver for stor løsning i ett steg
- antar krav som ikke er gitt
- ignorerer edge cases
- bryter lagdeling

## Definisjon av ferdig

En AI-leveranse er compliant når:

- relevante skills er identifisert
- regler er fulgt
- løsning er minimal
- ingen MUST-regler brytes
- risiko er vurdert
- antagelser er eksplisitt oppgitt

## Operativ kontrakt for AI-agenter

Agenten skal alltid levere:

- hva som ble endret
- hvilke docs som ble fulgt
- hvilke regler som styrte valgene
- hvilke antagelser som ble gjort
- hvilke risikoer som ble identifisert
- hva som er verifisert (og eventuelle avvik)

## Direktehet-prinsippet

Foretrekk:

- eksplisitte beslutninger knyttet til konkrete regler
- enkel og sporbar endringsflyt

Unngå:

- implisitte antakelser uten doc-støtte
- lange resonneringskjeder uten operativ verdi

## Eksempel (kort)

Oppgave: Legg til nytt auth-endepunkt.

1. Les `user-auth-api.skill.md` + `user-auth-api-mvp-spec.md`.
2. Mapp krav til regler (`401` semantikk, inputvalidering, docs-impact).
3. Implementer minimal endpoint-flyt.
4. Verifiser med lint/test/build.
5. Oppdater relevante docs i samme endring.
6. Rapporter hvilke regler som ble fulgt.

## Endringslogg

- 2026-02-25: Opprettet
- 2026-02-25: Utvidet med execution protocol, compliance loop, mandatory reasoning output, authority/assumption/determinism-regler
- 2026-02-25: Finjustert med escalation rule, scope freeze, implicit knowledge ban, verification hierarchy, non-ambiguity tie-breaker og fast compliance summary-format
