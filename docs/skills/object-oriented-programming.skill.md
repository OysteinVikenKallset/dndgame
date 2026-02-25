# Skill: Object-Oriented Programming (Pragmatic)

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-25

## Mål

Bruke objektorientert programmering (OOP) for å modellere domeneatferd tydelig, beskytte invariants og redusere endringsrisiko.

OOP skal brukes når det gir bedre modellering og vedlikeholdbarhet, ikke som standard for all kode.
Denne skillen styrer bruk av OOP i repoet, ikke generell teori om OOP.

Full OOP-reference finnes i `docs/reference/object-oriented-programming.md`.

## Når den brukes

- Når domeneobjekter har tydelig state + atferd
- Når invariants må beskyttes i én modell (f.eks. statusoverganger)
- Når polymorf oppførsel gir enklere flyt enn store `if/else`
- Ved refaktorering fra prosedural logikk til mer sammenhengende modell

## Kjerneprinsipper (må aldri brytes)

1. Atferd skal ligge nær data
   - Hvis regler gjelder et objekt, skal reglene ligge i objektet.

2. Encapsulation beskytter invariants
   - Ugyldige tilstander skal ikke være enkle å representere eller sette fra utsiden.

3. Preferér composition over inheritance
   - Arv brukes kun når substitusjon faktisk er riktig (`is-a`), ikke for kodegjenbruk alene.
   - Arv er siste utvei, ikke første valg.

4. OOP skal redusere kompleksitet
   - Hvis klasser/hierarkier gjør flyten mer indirekte uten klar gevinst: stopp.

5. Tell, don't ask (når det gir mening)
   - Foretrekk at modellen utfører handling (`user.deactivate()`) fremfor at ekstern kode leser intern state og bestemmer alt.

6. Small public surface
   - Hold få, tydelige offentlige metoder per modell.
   - Ikke eksponer intern state mer enn nødvendig.

7. No anemic domain
   - Domenemodeller skal ikke være rene data-containere med getters/setters uten domeneatferd.

## OOP-beslutningsregel

Før du introduserer en klasse, dokumenter kort:

- hvilket problem løser klassen?
- hvilken invariant/atferd samles i modellen?
- hvorfor er klasse enklere enn ren funksjon her?

Hvis dette ikke kan forklares tydelig, bruk enklere løsning.

## Class vs funksjon (obligatorisk valg)

Bruk class når:

- du trenger tilstand + invariants
- du trenger livssyklus/statusoverganger
- du trenger tydelig eier av regler/atferd

Bruk funksjon når:

- du gjør ren transformasjon uten state
- du gjør ren beregning
- du gjør enkel validering som ikke tilhører en entity

## Kjernebyggesteiner (hvordan de brukes)

### Encapsulation

- Hva: skjuler intern state og eksponerer trygg atferd.
- Bruk når: objektet har regler for hvordan state kan endres.
- Ikke bruk når: objektet kun er passiv data uten oppførsel.

### Abstraction

- Hva: eksponerer kun relevant API for brukeren.
- Bruk når: intern kompleksitet bør skjules bak enkel kontrakt.
- Ikke bruk når: abstraksjonen er tynn og kun videresender.

### Inheritance

- Hva: deler struktur/atferd mellom relaterte typer.
- Bruk når: ekte `is-a`-forhold med stabil substitusjon.
- Ikke bruk når: motivasjonen er kun å gjenbruke kode.

### Polymorphism

- Hva: ulike implementasjoner bak samme kontrakt.
- Bruk når: variasjon i oppførsel ellers blir store betingelser.
- Ikke bruk når: det finnes kun én stabil variant.

## Domain-spesifikk OOP-policy

- Entities har identitet (f.eks. `UserId`).
- Value Objects er immutable (f.eks. `Email`).
- Domenemetoder uttrykker forretningshandlinger (`user.deactivate()`), ikke tekniske operasjoner.
- Sideeffekter/IO i domain er forbudt; domain skal være testbart uten infrastruktur.

## Object Lifetime Rule

En modell skal ha tydelig livssyklus:

- hvem oppretter den
- hvem eier den
- hvem kan endre den
- når den anses ugyldig

Hvis dette ikke er tydelig, er modellen feil designet.

## Mutation Policy

State-endringer skal være eksplisitte og kontrollerte.

Foretrekk:

- immutable value objects
- eksplisitte metoder for state-endring

Unngå:

- direkte property-mutasjon
- skjult state-endring i hjelpemetoder

## Construction Integrity Rule

Et objekt må være gyldig etter konstruksjon.

Constructors/factories MUST:

- validere input
- sikre invariants
- forhindre halvferdige objekter

Hvis objektet kan eksistere i ugyldig tilstand, er det designfeil.

## DTO Boundary Rule

DTO-er skal aldri inneholde domeneatferd.
Domeneobjekter skal aldri brukes direkte som transportobjekter.

Mapping mellom DTO og domain MUST skje ved laggrense.

## Operative regler (MUST / SHOULD / MUST NOT)

MUST:

- holde invariants inne i domenemodellen
- navngi klasser etter domeneansvar, ikke teknikk
- bruke små, fokuserte offentlige API-er
- verifisere med tester og `npm run check`
- holde domeneatferd i domain (ikke i controllers/adapters)

SHOULD:

- foretrekke immutable/trygge overganger der mulig
- holde constructors enkle og validere nødvendig input
- bruke interfaces/porter når variasjon er reell

MUST NOT:

- lage store `Manager`/`Service`-klasser uten tydelig ansvar
- eksponere intern state ukontrollert
- bruke arv som substitutt for composition
- splitte enkel logikk i mange små klasser uten gevinst
- lage anemisk domene (kun data + getters/setters)
- legge IO/sideeffekter i domain-objekter

## Hard stop-regler

Stopp hvis:

- en klasse får mer enn ett tydelig ansvar
- arv introduseres uten klar substitusjon
- OOP-løsningen øker indirekte flyt og kognitiv last
- invariants fortsatt håndteres utenfor modellen
- domeneobjekter degraderes til rene DTO-er

## OOP Smell Indicators

Refaktorer hvis du ser:

- metoder som kun returnerer state
- mange getters brukt utenfor objektet
- lange parameterlister
- type-switch/`instanceof`-kjeder
- klasser med kun én metode

Dette indikerer ofte feil modellering.

## Consistency Rule

Hvis eksisterende kode bruker en tydelig modellstil,
skal nye modeller følge samme stil med mindre endring er begrunnet.

## Anti-overengineering

Følgende er ikke tillatt uten dokumentert behov:

- abstrakte baseklasser med én implementasjon
- dype arvetrær
- patterns/hierarkier som ikke reduserer kompleksitet

## Kvalitetskriterier

- Kriterium 1: modellens ansvar er tydelig
- Kriterium 2: invariants håndheves av modellen
- Kriterium 3: flyt er enklere enn før, ikke mer indirekte
- Kriterium 4: tester dekker normal- og feilflyt
- Kriterium 5: dependency rule i Clean Architecture er bevart

## Testbarhet

- Domain-objekter skal kunne testes uten mocks.
- Use-cases skal teste interaksjon via porter.
- OOP-design som krever tung mocking i domain er et varselsignal.

## Definisjon av ferdig

OOP-bruk er riktig når:

- klassevalg er kort begrunnet
- state og atferd hører naturlig sammen
- invariants er beskyttet i modellen
- løsning er testet og grønn i `npm run check`
- ingen unødvendig arv/abstraksjon er introdusert

## Operativ kontrakt for AI-agenter

Agenten skal:

- foreslå enkleste modell først (funksjon eller klasse)
- bruke klasse kun når den beskytter atferd/invariants bedre
- foretrekke composition over inheritance
- stoppe hvis OOP-forslaget øker kompleksitet uten klar gevinst
- begrunne hvorfor class er bedre enn funksjon i aktuell endring
- ikke introdusere arv uten eksplisitt, dokumentert behov
- følge naming: entities = substantiv, atferd = verb

## Endringslogg

- 2026-02-25: Opprettet
- 2026-02-25: Utvidet med class-vs-funksjon-regel, domain OOP-policy, no-anemic-domain, testbarhetskrav og strengere AI-regler
- 2026-02-25: Finjustert med object lifetime, mutation policy, construction integrity, DTO boundary, smell indicators og consistency rule
