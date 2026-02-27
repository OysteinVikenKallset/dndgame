# Skill: Clean Code

## Metadata

- Owner: Engineering Team
- Stability: Stable
- Last reviewed: 2026-02-24

## Mål

Produsere kode som er:

- lesbar uten forklaring
- enkel å endre
- trygg å refaktorere
- konsistent
- strukturert for lang levetid

Hvis TDD er arbeidsprosessen, er Clean Code kvalitetsstandarden på resultatet.

## Når den brukes

- Ved all ny kode
- Ved refaktorering av eksisterende kode
- Ved review av PR-er og AI-genererte endringer

## Kjerneprinsipper

- Lesbarhet før smarthet (må aldri brytes)
- Små, fokuserte enheter med tydelig ansvar (må aldri brytes)
- Endringer skal være trygge og verifiserbare (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Kode leses mer enn den skrives
   - Optimaliser for lesbarhet, forståelighet og intensjon.
   - Ikke optimaliser for "cleverness", kortest mulig kode eller triks.

2. Én funksjon, ett ansvar
   - En funksjon skal gjøre én ting.
   - Hvis beskrivelsen blir "og så gjør den også...", splitt funksjonen.
   - Heuristikk: ca. maks 15-20 linjer og ett abstraksjonsnivå.
   - En funksjon skal enten transformere data, validere input, orkestrere steg, eller håndtere sideeffekt.
   - Den skal ikke gjøre flere av disse samtidig.

3. Navn skal forklare intensjon
   - Navn skal gjøre kommentarer overflødige.
   - Unngå generiske navn som `data`, `value`, `thing`, `util`, `helper`, `manager`.
   - Foretrekk navn som uttrykker atferd, f.eks. `calculateInvoiceTotal`.

4. Ingen magiske tall eller strenger
   - Uforklarte konstanter i logikk er forbudt.
   - Bruk navngitte konstanter med tydelig semantikk.

5. Ingen skjult sideeffekt
   - Funksjoner skal enten være rene eller eksplisitt sideeffektfulle.
   - Ikke bland validering, transformasjon og persistens i samme steg.

6. Unngå dyp nesting
   - Hold nesting grunt (vanligvis maks 2-3 nivåer).
   - Bruk guard clauses og tidlige returns.

7. Konsistent abstraksjonsnivå
   - Ikke bland domeneoperasjoner og infrastrukturanrop i samme funksjon.

8. Skill domene fra rammeverk
   - Forretningslogikk skal ikke avhenge av UI- eller web-rammeverk.
   - Rammeverk/infrastruktur skal ligge i ytterlag.

9. Avhengigheter skal peke innover
   - UI/API/DB peker mot domene, ikke omvendt.

10. Små moduler

- Del opp store filer og store komponenter før de blir uhåndterlige.

11. Kommentarer er siste utvei

- Kommenter hvorfor, ikke hva, når kode ikke kan uttrykke hensikten tydelig.

12. Testbarhet er obligatorisk

- Kode skal være testbar uten hacks.
- Hvis noe er vanskelig å teste, indikerer det ofte designproblem.

## Operativ arbeidsflyt

1. STEP 1: Forstå krav og avklar ansvar
2. STEP 2: Definer minimal endring
3. STEP 3: Implementer liten, lesbar løsning
4. STEP 4: Kjør tester/build og bekreft
5. STEP 5: Refaktorér trygt for lesbarhet
6. STEP 6: Verifiser igjen og dokumenter beslutning ved behov

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hard Stop-regel

Hvis koden blir større eller mer kompleks enn nødvendig, skal agenten/utvikleren:

- Stoppe
- Forklare hvor kompleksiteten kom inn
- Redusere til minste lesbare løsning
- Verifisere på nytt

## Kompleksitetsindikatorer

Kode skal refaktoreres når en eller flere indikatorer oppstår:

- mer enn 3 betingelser i én funksjon
- mer enn 3 parametere
- mer enn 1 nivå med konseptuell abstraksjon i samme flyt
- leseren må "spole frem og tilbake" mentalt for å forstå hva som skjer

Dette er objektive varseltegn, spesielt for AI-generert kode.

## Kognitiv belastning

Kode skal kunne forstås sekvensielt uten unødvendig mental belastning.

Unngå løsninger som krever at leseren må:

- hoppe mellom filer for grunnleggende forståelse
- holde mange midlertidige variabler i hodet samtidig
- tolke forkortelser eller skjult kontekst

Hvis leseren må stoppe og analysere for mye, skal designet forenkles.

## Hva "bekreftelse" betyr

- Gyldig bekreftelse: build/test passerer og adferd matcher krav.
- Ugyldig bekreftelse: kun "ser riktig ut", eller grønt resultat med skjulte feil/ignored checks.
- Bekreftelsen må være reproduserbar.

## Regler (må/skal)

- Må: Bruk beskrivende navn på funksjoner, variabler og typer.
- Må: Hold funksjoner små og fokuserte.
- Må: Håndter feil eksplisitt.
- Må: Bruk konsistent feilmønster per lag (f.eks. throw eller Result-type).
- Skal: Foretrekk tidlige returns fremfor dyp nesting.
- Skal: Fjern død kode og duplisering når det er trygt.

## Feilhåndtering skal være konsistent

- Bruk ett mønster for feilhåndtering innen samme lag.
- Ikke bland flere feilmønstre uten tydelig grunn.
- Ikke swallow errors.
- Ikke returner `null` der feiltilstand skal signaliseres eksplisitt.

## Forskjell på "ny" og "endre"

Eksisterende kode kan endres når:

- den er feil
- den er uleselig eller bryter prinsippene
- endringen er nødvendig for nåværende krav

Eksisterende kode skal ikke endres kun for stil dersom det øker risiko uten verdi.

## Forbudte handlinger

- Legge inn "midlertidige" hacks uten tydelig plan.
- Skjule problemer med brede `try/catch` uten håndtering.
- Innføre magiske strenger/tall uten forklaring eller kontekst.
- Blande flere ansvar i samme funksjon for å "spare tid".
- Introdusere "god classes", store "manager"-klasser eller "utils"-filer med ukontrollert vekst.
- Skjult global state eller ukontrollert mutasjon.
- Over-generalisering uten konkret behov.

## Anti-overengineering-regel

Følgende er ikke tillatt uten konkret, dokumentert behov:

- ekstra lag/abstraksjoner
- generiske rammeverk for ett enkelt case
- tidlig optimalisering
- konfigurasjonssystemer for ikke-eksisterende behov
- interfaces uten faktisk variasjon i bruk
- generiske typer uten konkrete krav
- abstrakte basisklasser uten smerte i eksisterende kode
- design patterns som ikke løser et dokumentert problem

Abstraksjon skal normalt komme etter observert duplisering/smerte.

## Abstraksjonstest (før ny abstraksjon)

Før ny abstraksjon introduseres, sjekk:

- Har vi minst to konkrete implementasjoner?
- Har vi observert reell duplisering eller smerte?
- Forenkler abstraksjonen faktisk lesing, ikke bare struktur?

Hvis svaret er nei, vent med abstraksjonen.

## Refaktorering er påkrevd når

- duplisering oppstår
- en funksjon har mer enn ett ansvar
- navn ikke lenger beskriver intensjon
- kompleksiteten øker og lesbarhet faller

## Kvalitetskriterier

- Kriterium 1: Koden er lett å lese uten ekstra forklaring.
- Kriterium 2: Ansvar per funksjon/modul er tydelig.
- Kriterium 3: Feilhåndtering er konsistent og eksplisitt.
- Kriterium 4: Test/build verifiserer at endringen er trygg.
- Kriterium 5: Diffen er fokusert på problemet som løses.
- Kriterium 6: Sideeffekter er eksplisitte.
- Kriterium 7: Struktur og abstraheringsnivå er konsistent.

## Granularitetsregel

Én endring skal være så liten at:

- den kan forklares på få setninger
- den har lav risiko
- den er enkel å reviewe

## Tillatt vs ikke tillatt forbedring

Tillatt:

- bedre navn
- enklere kontrollflyt
- mindre duplisering
- tydeligere feilhåndtering

Ikke tillatt:

- skjult feature-utvikling under refaktorering
- API-endringer uten krav
- store strukturelle endringer uten plan eller ADR

## Definisjon av ferdig

Skillen er fulgt riktig når:

- endringen løser ett tydelig problem
- koden er lesbar og ansvar er tydelig
- tester/build er verifisert
- ingen forbudte handlinger er brukt
- ingen unødvendig abstraksjon er introdusert
- navngivning uttrykker intensjon og atferd

## Operativ kontrakt for AI-agenter

Agenten skal:

- prioritere lesbarhet og enkelhet over "smarte" løsninger
- gjøre minste sikre endring som løser problemet
- unngå spekulasjon om fremtidige behov
- validere resultat med test/build når relevant
- ikke innføre patterns eller abstrahering uten dokumentert smerte
- foretrekke konkrete løsninger først, generalisere senere

## Direktehet-prinsippet

Foretrekk:

- rett frem kode
- eksplisitt flyt
- tydelig kontrollstruktur

Unngå:

- indirekte callbacks uten gevinst
- unødvendig funksjonskjeding
- abstrakt kontrollflyt for enkle problemer

Ekstra streng variant:

- Agenten skal foreslå refaktorering i små steg, ikke i store omskrivninger.
- Agenten skal stoppe hvis krav blir uklare og be om avgrensning.

## Eksempel

Dårlig:

- `const x = arr.filter(...).map(...).reduce(...)` med uklar hensikt i én linje.
- funksjon som både validerer, transformerer og lagrer i database.

Bedre:

- Del opp i små navngitte steg som uttrykker formål.
- Bruk tydelige variabelnavn som beskriver domenet.
- skill mellom ren domeneoperasjon og infrastruktur-kall.

## Vanlige feil

- For store funksjoner med flere ansvar.
- Uklare navn (`data`, `item`, `value`) uten kontekst.
- Refaktorering uten tester.
- Overbruk av abstrahering for enkle problemer.

## Viktig realitet

Clean Code er ikke:

- perfeksjonisme
- maksimal abstraksjon
- enterprise-mønstre for sin egen del
- "smart arkitektur" uten dokumentert behov

Clean Code er fravær av friksjon i lesing, endring og vedlikehold.

## Endringslogg

- 2026-02-24: Opprettet
- 2026-02-24: Utvidet med operativt regelverk for struktur, testbarhet og AI-spesifikke guardrails
- 2026-02-24: Skjerpet med kompleksitetsindikatorer, kognitiv belastning, konsistent feilhåndtering, abstraksjonstest og direktehet-prinsipp
