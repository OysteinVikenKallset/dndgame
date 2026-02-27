# Skill: <navn-på-skill>

## Metadata

- Owner: <person|rolle|team>
- Stability: <Stable|Evolving|Experimental>
- Last reviewed: <YYYY-MM-DD>

Dette feltet er obligatorisk for nye skills.

## Mål

Kort beskrivelse av hva denne skillen skal oppnå.

## Når den brukes

Beskriv situasjoner der skillen skal brukes.

## Kjerneprinsipper

- Prinsipp 1 (må aldri brytes)
- Prinsipp 2 (må aldri brytes)
- Prinsipp 3 (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Regel 1
   - Konkret, verifiserbar beskrivelse.

2. Regel 2
   - Konkret, verifiserbar beskrivelse.

3. Regel 3
   - Konkret, verifiserbar beskrivelse.

## Operativ arbeidsflyt

1. STEP 1: <handling>
2. STEP 2: <bekreftelse>
3. STEP 3: <handling>
4. STEP 4: <bekreftelse>
5. STEP 5: <sikker forbedring>
6. STEP 6: <bekreftelse igjen>

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Docs Impact (obligatorisk)

- Hvilke docs påvirkes av denne endringen?
- Hvilke docs ble oppdatert i samme endring?
- Hvis ingen docs ble oppdatert: hvorfor er docs uendret?

## Hard Stop-regel

Hvis forventet signal ikke oppnås i riktig steg, skal agenten:

- Stoppe
- Forklare hvorfor
- Korrigere input/tilnærming
- Starte ny, mindre syklus

## Kompleksitetsindikatorer

Definer objektive signaler for når innhold må forenkles eller refaktoreres, for eksempel:

- for mange betingelser i én funksjon/flyt
- for mange parametere i én operasjon
- blanding av flere abstraksjonsnivå i samme flyt
- løsningen krever mental "spoling frem og tilbake" for å forstås

Beskriv konkrete terskler for denne skillen.

## Kognitiv belastning

Definer hvordan løsningen holdes lett å forstå sekvensielt:

- hva leseren skal kunne forstå uten å hoppe mellom mange filer
- hvor mye kontekst leseren må holde i hodet samtidig
- hvilke navngivnings-/strukturvalg som reduserer mental belastning

## Hva "bekreftelse" betyr

- Definer eksplisitt hva som er gyldig signal.
- Definer hva som er ugyldig signal (f.eks. oppsettfeil, syntaxfeil).
- Kun gyldig signal teller som fullført steg.

## Regler (må/skal)

- Må-regel 1
- Må-regel 2
- Skal-regel 1

## Feilhåndtering skal være konsistent

Definer ett konsistent feilmønster per lag/område:

- hvilket mønster brukes (f.eks. throw, Result-type)
- hva som er forbudt (f.eks. swallow errors, inkonsistente returverdier)
- hvordan feil signaliseres eksplisitt

## Forskjell på "ny" og "endre"

Eksisterende innhold kan kun endres dersom:

- innholdet er feilaktig
- innholdet bryter spesifikasjonen
- endringen skjer i en egen, dokumentert syklus

Eksisterende innhold skal ikke justeres for å skjule svak løsning.

## Forbudte handlinger

- Ikke gjør X
- Ikke gjør Y

## Anti-overengineering-regel

I implementeringssteg er følgende ikke tillatt uten eksplisitt behov:

- nye abstraheringer
- ekstra funksjonalitet
- generiske løsninger
- konfigurasjonssystemer
- nye hjelpeverktøy uten dokumentert grunnlag

## Abstraksjonstest (før ny abstraksjon)

Før ny abstraksjon introduseres, svar på:

- finnes minst to konkrete implementasjoner?
- er duplisering/smerte faktisk observert?
- forenkler abstraksjonen lesing, ikke bare struktur?

Hvis svaret er nei, vent med abstraksjonen.

## Kvalitetskriterier

- Kriterium 1: Feiler riktig uten løsning
- Kriterium 2: Består med korrekt løsning
- Kriterium 3: Feiler igjen ved bevisst regressjon
- Kriterium 4: Ikke over-spesifikk
- Kriterium 5: Ikke skjør (brittle)

## Granularitetsregel

Én syklus skal være så liten at:

- endringen kan gjøres raskt
- diffen er minimal
- risikoen er lav

## Tillatt vs ikke tillatt forbedring

Tillatt:

- strukturforbedring
- fjerning av duplisering
- lesbarhetsforbedring

Ikke tillatt:

- skjult feature-utvikling
- endring av observerbar atferd uten ny syklus
- API-endringer uten eksplisitt krav

## Definisjon av ferdig

Skillen er fulgt riktig når:

- alle steg i arbeidsflyten er dokumentert og bekreftet
- kvalitetskriteriene er oppfylt
- forbudte handlinger ikke er brutt

## Operativ kontrakt for AI-agenter

Agenten skal:

- følge skillens arbeidsflyt eksplisitt
- ikke hoppe over verifikasjonssteg
- ikke spekulere i fremtidige krav utenfor scope
- foretrekke minste sikre endring per syklus

## Direktehet-prinsippet

Foretrekk:

- rett frem kode og eksplisitt flyt
- tydelig kontrollstruktur

Unngå:

- indirekte kontrollflyt uten dokumentert gevinst
- unødvendig chaining/abstraksjon for enkle problemer

Ekstra streng variant:

- Agenten skal opptre som om fremtidige krav er ukjente.
- Agenten skal ikke optimalisere for hypotetiske scenarier.

## Architecture Add-on (valgfri)

Bruk denne blokken når skillen gjelder arkitektur/systemdesign.

### Domain vs Application

- Definer eksplisitt hva som er varige forretningsregler (`domain`) vs use-case-orkestrering (`application`).
- Hvis en regel gjelder uansett use-case, skal den ligge i `domain`.

### Invariants-regel

- Domenemodeller skal beskytte egne invariants.
- Ugyldige tilstander skal ikke være representerbare.

### DTO-regel

- Transportobjekter skal ikke brukes direkte i `domain`.
- Mapping skal skje ved laggrensene.

### Import-regel

- Definer tillatt importretning per lag.
- Indre lag skal aldri importere ytre lag.

### Transaksjonsregel

- Definer hvor transaksjonsgrenser ligger (typisk i `application`).
- `domain` skal ikke håndtere transaksjonsstyring.

### Service-navn-regel

- Forby vage navn som `Manager` og generisk `Service` uten tydelig ansvar.

### Teststrategi per lag

- Definer hvilke tester som forventes i hvert lag (domain/application/infrastructure/interface).

## Eksempel

Legg inn et kort eksempel (kode, pseudo-kode eller prosess).

## Vanlige feil

- Feil 1
- Feil 2

## Endringslogg

- YYYY-MM-DD: Opprettet
- YYYY-MM-DD: Oppdatert <hva>
