# Design Patterns Reference

Last reviewed: 2026-02-25

Denne filen beskriver hva patterns er. Regler for bruk styres alltid av `docs/skills/design-patterns.skill.md`.

Kort katalog over patterns brukt/akseptert i prosjektet.
Bruksregler styres av `docs/skills/design-patterns.skill.md`.

## Statusnivå

- Preferred: anbefalt standardvalg når problemet matcher
- Allowed: tillatt, men ikke førstevalg i de fleste tilfeller
- Discouraged: bør som hovedregel unngås
- Experimental: krever eksplisitt vurdering og team-godkjenning

## Pattern typer

- Creational: hvordan objekter opprettes
- Structural: hvordan komponenter kobles sammen
- Behavioral: hvordan flyt/ansvar fordeles

## Pragmatisk katalog (mest relevant i dette repoet)

### Strategy (Behavioral)

- Status: Preferred
- Cost: Low
- Hva: byttbar algoritme/oppførsel bak felles kontrakt.
- Bruk når: flere reelle varianter av samme handling.
- Ikke bruk når: kun én stabil implementasjon.
- Anti-pattern smell: lange if/else-kjeder for variantlogikk.

### Adapter (Structural)

- Status: Preferred
- Cost: Low
- Hva: oversetter mellom intern kontrakt og ekstern avhengighet.
- Bruk når: DB/API/3rd-party-integrasjon, DTO <-> domain mapping.
- Ikke bruk når: kun ekstra lag uten transformasjon.
- Anti-pattern smell: domain/application kjenner tekniske detaljer fra eksternt system.

### Factory (Creational)

- Status: Allowed
- Cost: Medium
- Hva: samler kompleks opprettelse med regler/defaults.
- Bruk når: konstruksjon har invariants/validering.
- Ikke bruk når: objektopprettelse er trivial.
- Anti-pattern smell: gjentatt opprettelseslogikk med dupliserte defaults/invariants.

### Builder (Creational)

- Status: Allowed
- Cost: Medium
- Hva: stegvis oppbygging av kompleks objektstruktur.
- Bruk når: mange valgfrie felter krever kontroll.
- Ikke bruk når: få felter og enkel constructor er tydeligere.
- Anti-pattern smell: konstruktører med mange valgfrie parametere og uklare kombinasjoner.

### Command (Behavioral)

- Status: Allowed
- Cost: Medium
- Hva: encapsuler handling/use-case som objekt.
- Bruk når: kø/retry/scheduling/invoker gir konkret verdi.
- Ikke bruk når: vanlig funksjon er nok.
- Anti-pattern smell: orkestrering for kø/retry presses inn i vanlige funksjonskall.

### Observer / Pub-Sub (Behavioral)

- Status: Allowed
- Cost: Medium
- Hva: event-basert reaksjon med løs kobling.
- Bruk når: flere reaksjoner etter én handling.
- Ikke bruk når: skjult kontrollflyt gjør MVP mer uforutsigbar.
- Anti-pattern smell: use-case som gjør mange sideeffekter direkte i samme flyt.

### Decorator (Structural)

- Status: Allowed
- Cost: Medium
- Hva: legg til atferd rundt eksisterende komponent.
- Bruk når: logging/caching/metrics/retries rundt port/funksjon.
- Ikke bruk når: enkel wrapper er mer lesbar.
- Anti-pattern smell: repetert cross-cutting kode (logging/metrics/retry) i flere kallesteder.

### Repository (Structural, pragmatisk)

- Status: Preferred
- Cost: Medium
- Hva: persistensabstraksjon bak domeneorientert kontrakt.
- Bruk når: domain/application skal skjermes fra DB/ORM.
- Ikke bruk når: ett generisk CRUD-repo brukes for alt.
- Anti-pattern smell: use-cases kjenner ORM/DB-detaljer direkte.

### State (Behavioral)

- Status: Allowed
- Cost: Medium
- Hva: flytter state-avhengig logikk ut av store `if/else`.
- Bruk når: mange statusoverganger med ulik logikk.
- Ikke bruk når: få states og enkel flyt.
- Anti-pattern smell: stadig voksende statuslogikk i nested if/else.

## Caution Patterns

Patterns som krever ekstra vurdering:

- Singleton (Status: Discouraged, Cost: High)
- Visitor (Status: Discouraged, Cost: High)
- Interpreter (Status: Discouraged, Cost: High)
- Flyweight (Status: Experimental, Cost: High)

Begrunnelse: høy kompleksitet, risiko for skjult kobling eller sjelden behov i denne kodebasen.

## GoF-katalog (23 patterns)

Listingen betyr ikke at alle patterns bør brukes i dette prosjektet.

### Creational (5)

- Abstract Factory
- Builder
- Factory Method
- Prototype
- Singleton

### Structural (7)

- Adapter
- Bridge
- Composite
- Decorator
- Facade
- Flyweight
- Proxy

### Behavioral (11)

- Chain of Responsibility
- Command
- Interpreter
- Iterator
- Mediator
- Memento
- Observer
- State
- Strategy
- Template Method
- Visitor

## Referansebruk

- Ved designvalg: start i skillen (`docs/skills/design-patterns.skill.md`).
- Ved behov for pattern-oppslag: bruk denne referansen.
- Hvis pattern ikke er listet her: følg Unknown Pattern Rule i skillen.

## Quick Lookup

Hvis problemet er -> vurder pattern

- variabel algoritme -> Strategy
- ekstern integrasjon -> Adapter
- kompleks konstruksjon -> Factory/Builder
- flere reaksjoner -> Observer
- mange states -> State
- ekstra atferd rundt eksisterende komponent -> Decorator
