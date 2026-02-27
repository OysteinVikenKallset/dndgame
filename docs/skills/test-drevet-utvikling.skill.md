# Skill: Test-drevet utvikling (TDD)

## Metadata

- Owner: Engineering Team
- Stability: Stable
- Last reviewed: 2026-02-24

## Mål

Bruk TDD for å utvikle kode i små, trygge steg med høy kvalitet og enkel refaktorering.

## Kjerneprinsipper (må aldri brytes)

Inspirert av Kent Beck: jobb alltid i loopen Red -> Green -> Refactor.

1. Test først, alltid

- Ingen produksjonskode før en feilet test finnes.
- Hvis ingen test feiler: stopp.

2. Kun én test om gangen

- Én ny test per syklus.
- Testen representerer én ny atferd.

3. Minimal implementasjon

- Skriv minste mulige kode for å få testen grønn.
- Ingen optimalisering, ingen fremtidssikring.

4. Refaktorering kun etter grønn test

- Refaktorering er kun tillatt når alle tester er grønne.
- Ingen funksjonell endring under refaktorering.
- Kjør tester igjen etter refaktorering.

5. Ikke spekuler i fremtidige krav

- Implementer kun det testen krever.
- YAGNI gjelder strengt.

11. Start med enkleste mulige case

- Første test skal være enkleste mulige atferd.
- Ikke start med edge cases.
- Ikke start med kompleks input.
- Bygg kompleksitet gradvis.

## Streng arbeidsflyt (må logges eksplisitt)

1. STEP 1: Write failing test (RED)
2. STEP 2: Confirm failure
3. STEP 3: Write minimal implementation (GREEN)
4. STEP 4: Confirm success
5. STEP 5: Refactor safely
6. STEP 6: Confirm success again

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hard Stop-regel

Hvis testen ikke feiler før implementasjon, skal agenten:

- Stoppe
- Forklare hvorfor testen ikke feiler
- Skrive en bedre test

Dette skal forhindre falsk TDD.

## Hva "Confirm failure" betyr

For STEP 2 gjelder følgende:

- Testen må feile av riktig grunn.
- Feilmeldingen skal peke på manglende implementasjon eller manglende atferd.
- Testen skal ikke feile på grunn av syntax-feil, import-feil eller testoppsett.

Hvis testen feiler av feil grunn, er den ikke gyldig RED.

## Designregler for tester

6. Test atferd, ikke implementasjon

- Test offentlig API.
- Ikke test private metoder eller interne detaljer.

7. Testen skal være lesbar spesifikasjon

- Bruk navn som beskriver forretningsatferd, for eksempel:
  - returns 0 when cart is empty
  - applies 25% VAT for Norwegian customers

8. Ingen logikk i testen

- Ingen conditionals.
- Ingen loops.
- Ingen beregning som replikerer produksjonslogikk.

9. Én grunn til å feile

- Testen skal feile av én tydelig årsak.

## Arkitekturregler

10. Skill domene fra rammeverk

- Legg forretningslogikk i rene funksjoner.
- Test ren logikk isolert.
- Test UI separat.

Frontend-regler:

- Test brukerens perspektiv.
- Bruk semantiske queries.
- Ikke test CSS-klasser.
- Ikke test implementasjonsdetaljer.

## Forbudte handlinger

- Skrive implementasjon før test.
- Skrive flere nye tester i én iterasjon.
- Endre eksisterende tester kun for å passe svak design.
- Fjerne tester for å få grønn build.
- Implementere edge cases uten test.

## Forskjell på ny test og endre test

Eksisterende tester kan kun endres dersom:

- testen er feilaktig
- testen bryter med spesifikasjonen
- endringen skjer i en egen Red -> Green -> Refactor-syklus

Eksisterende tester skal ikke justeres for å skjule svak implementasjon.

## Testkvalitet (quality guard)

En god test skal:

- feile uten implementasjon
- bestå med korrekt implementasjon
- feile hvis implementasjonen brytes
- ikke være over-spesifikk
- ikke være skjør (brittle)

## Anti-overengineering-regel (under GREEN)

Under GREEN er følgende ikke tillatt:

- nye abstraheringer som ikke kreves av testen
- ekstra funksjoner
- generiske løsninger uten konkret behov
- konfigurasjonssystemer uten testgrunnlag
- nye utils uten test

Kun kode som kreves for å passere aktuell test er tillatt.

## Når en test feiler

Agenten skal sjekke:

- Feiler testen av riktig grunn?
- Er testen for generell?
- Krever testen mer enn én endring?

Hvis ja: skriv en mindre test.

## Granularitetsregel

Hver syklus skal være så liten at:

- endringen tar under 5 minutter
- diffen er minimal
- risikoen er lav

## Refaktoreringstyper

Tillatt refaktorering:

- struktur (rename, extract function)
- fjerning av duplisering
- forbedring av lesbarhet

Ikke tillatt under refaktorering:

- endre offentlig API
- endre returtyper
- endre observerbar atferd

## Definisjon av ferdig (TDD)

En oppgave anses ferdig når:

- relevant test ble skrevet først og observert rød
- implementasjon ble gjort i minimale grønne steg
- refaktorering ble gjort kun med grønne tester
- all ny atferd er dekket av lesbare, stabile tester

## Operativ kontrakt for AI-agenter

Agenten skal jobbe under strict TDD-regler:

- Følg Red -> Green -> Refactor
- Ikke skriv produksjonskode før en feilet test finnes
- Skriv kun én ny test per iterasjon
- Ikke refaktorer mens tester er røde
- Ikke anticiper fremtidige krav

Ekstra streng variant:

- Agenten skal ikke optimalisere for fremtidige tester.
- Agenten skal oppføre seg som om fremtidige krav er ukjente.

## Videre modenhet (senere fase)

Når grunnreglene sitter kan teamet innføre:

- mutation testing tolerance
- 100% branch coverage i domene
- property-based testing for ren logikk
- håndheving av navnekonvensjon for tester

## Mini-eksempel (Vitest)

```ts
import { describe, expect, it } from "vitest";
import { add } from "./index";

describe("add", () => {
  it("returns sum of two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

I ekte TDD skrives denne testen først (rød), deretter implementeres add (grønn), og til slutt refaktorering ved behov.
