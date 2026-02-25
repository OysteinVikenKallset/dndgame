# Skill: Design Patterns Usage (Pragmatic)

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-25

## Mål

Styre når og hvordan design patterns brukes, slik at patterns reduserer kompleksitet i stedet for å introdusere den.

Design patterns er verktøy, ikke mål.
Ikke bruk patterns for arkitekturpynt.

Full pattern reference finnes i `docs/reference/design-patterns.md`.

## Når den brukes

- Når ny struktur/abstraksjon vurderes
- Når AI foreslår et pattern (skal vurderes eksplisitt)
- Ved refaktorering når duplisering eller kobling er observert
- Ved design av adapters/ports i Clean Architecture

## Pattern typer (beslutningshjelp)

- Creational: opprettelse av objekter
- Structural: struktur og kobling
- Behavioral: flyt og oppførsel

## Kjerneprinsipper (må aldri brytes)

1. Problem først, pattern etterpå
   - Pattern MUST NOT innføres uten et konkret problem.

2. Patterns skal redusere total kompleksitet
   - Hvis løsningen gir mer indirekte flyt uten klar gevinst: stopp.

3. Preferér konkrete løsninger først
   - Generaliser kun etter observert duplisering/smerte.

4. Patterns må være lesbare for teamet
   - Et pattern som ingen forstår øker risiko.

## Pattern-adopsjonsregel (obligatorisk)

Før et pattern introduseres MUST følgende dokumenteres i endringen:

- hvilket problem løses?
- hvilke alternativer ble vurdert?
- hvorfor er patternet enklere enn enklere kode?
- hvilke tradeoffs introduseres?

Hvis dette ikke kan svares på, skal patternet ikke innføres.

## Abstraksjonstest (hard gate)

Et pattern kan innføres kun hvis minst 2 av disse er sanne:

- det finnes minst to reelle implementasjoner eller variasjoner
- det finnes observert duplisering som patternet fjerner
- det reduserer kobling mot infrastruktur/rammeverk
- det gjør testing enklere
- det gjør flyten enklere å lese (ikke mer indirekte)

## Pattern Authority Rule

Hvis pattern-dokumentasjon og kodepraksis er i konflikt, gjelder denne skillen.

## Unknown Pattern Rule

Hvis et foreslått pattern ikke finnes i `docs/reference/design-patterns.md`, skal agenten:

- forklare patternet eksplisitt
- begrunne hvorfor det er nødvendig i denne konteksten
- få team-godkjenning før innføring

## Pattern Naming Rule

Når et pattern brukes, skal pattern-navnet oppgis eksplisitt i PR/leveranse.

## Operative regler (MUST / SHOULD / MUST NOT)

MUST:

- pattern må løse konkret problem
- pattern må gjøre flyt enklere å teste og forstå
- pattern må ikke bryte Clean Architecture dependency rule
- pattern skal introduseres i små steg med TDD der mulig

SHOULD:

- foretrekke patterns som er standard og kjente
- dokumentere pattern-valg kort (ADR ved større valg)

MUST NOT:

- innføre pattern for renhet eller "best practice" alene
- innføre abstraksjon før behov er observert
- skape skjult kontrollflyt uten tydelig behov

## Hard stop-regler

Stopp hvis:

- patternet øker indirekte flyt uten gevinst
- patternet krever mer enn ett nytt lag uten observert smerte
- patternet introduseres før duplisering/variasjon
- patternet bryter dependency rule
- agenten ikke kan forklare problemet som løses

## Definisjon av ferdig (Patterns)

Et pattern er riktig brukt når:

- det finnes et dokumentert problem
- patternet reduserer kompleksitet/kobling
- testene dekker både default og alternative flyter
- teamet kan forstå løsningen uten ekstra forklaring
- ingen nye unødvendige abstraksjoner er introdusert
- pattern-valg er eksplisitt navngitt i PR eller commit

## Operativ kontrakt for AI-agenter

Agenten skal:

- foreslå enkleste løsning først
- eksplisitt si hvilket problem patternet løser
- bruke abstraksjonstest før pattern introduseres
- stoppe hvis patternet ikke reduserer kompleksitet
- ikke introdusere ukjente patterns uten team-godkjenning

## Endringslogg

- 2026-02-25: Opprettet
- 2026-02-25: Refaktorert til pattern-governance (skill) + pattern-reference (se `docs/reference/design-patterns.md`)
