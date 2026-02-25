# Object-Oriented Programming Reference

Last reviewed: 2026-02-25

Kort oppslagsverk for OOP-begreper i prosjektet.
Bruksregler styres av `docs/skills/object-oriented-programming.skill.md`.

## OOP-kjerne

### Encapsulation

- Hva: skjule intern state og eksponere trygg atferd.
- Bruk når: modellen må beskytte invariants.
- Ikke bruk når: objektet kun er passiv transportdata.

### Abstraction

- Hva: eksponere et lite, tydelig API og skjule detaljer.
- Bruk når: intern implementasjon ellers skaper støy.
- Ikke bruk når: abstraksjonen kun videresender uten verdi.

### Inheritance

- Hva: dele atferd/struktur i et `is-a`-forhold.
- Bruk når: substitusjon er reell og stabil.
- Ikke bruk når: målet kun er kodegjenbruk.

### Polymorphism

- Hva: flere implementasjoner bak samme kontrakt.
- Bruk når: variantlogikk ellers blir mange `if/else`.
- Ikke bruk når: kun én stabil implementasjon finnes.

### Composition

- Hva: bygge opp atferd ved samarbeid mellom objekter.
- Bruk når: fleksibilitet og lav kobling er viktig.
- Ikke bruk når: enkel, direkte modell er nok.

## Pragmatiske retningslinjer

- Foretrekk composition over inheritance.
- Hold constructors små og tydelige.
- Beskytt invariants inne i modellen.
- Unngå store "god classes".
- Hvis en klasse kun inneholder data, vurder om funksjonell modell er enklere.

## OOP-smells (varselsignaler)

- Klasse med for mange ansvar.
- Dype arvetrær.
- Setter/getter-API uten domeneatferd.
- Invariants håndteres utenfor modellen.
- Mange `instanceof`/type-sjekker i stedet for tydelig design.

## SOLID (kort oppslagsdel)

### S — Single Responsibility Principle

- Hva: en modul/klasse har én grunn til å endre seg.
- Smell: "og så gjør den også ...", mye branching, blanding av validering + persistens + mapping.
- Typisk tiltak: splitte ansvar, flytte IO ut, introdusere tydelig use-case/adapter-grense.

### O — Open/Closed Principle

- Hva: utvid ved å legge til ny kode, ikke endre mye eksisterende kode.
- Smell: nye varianter krever endring i mange `if/else` eller `switch`.
- Typisk tiltak: Strategy/polymorphism når variasjon er reell.

### L — Liskov Substitution Principle

- Hva: subtyper må kunne erstatte supertyper uten overraskelser.
- Smell: arv med "men dette funker ikke her", subklasser som bryter kontrakt.
- Typisk tiltak: unngå arv, bruk composition.

### I — Interface Segregation Principle

- Hva: små, målrettede interfaces.
- Smell: "fat interface" der implementasjoner får dummy-metoder.
- Typisk tiltak: splitte port-kontrakter etter use-case-behov.

### D — Dependency Inversion Principle

- Hva: høy-nivå policy avhenger av abstraksjoner, ikke detaljer.
- Smell: `domain/application` importerer DB/HTTP/bibliotek direkte.
- Typisk tiltak: porter i `application/domain`, adaptere i `infrastructure/interface`.

Merk: i dette prosjektet overlapper DIP med Clean Architecture dependency rule.

## Mini-eksempler

### Encapsulation + invariant

Kontekst: `domain`

```ts
class UserProfile {
  private displayName: string;

  constructor(displayName: string) {
    const normalized = displayName.trim();

    if (normalized.length === 0) {
      throw new Error("Display name is required");
    }

    this.displayName = normalized;
  }

  public rename(nextDisplayName: string): void {
    const normalized = nextDisplayName.trim();

    if (normalized.length === 0) {
      throw new Error("Display name is required");
    }

    this.displayName = normalized;
  }
}
```

Prosjektets feilmønster styres av relevant skill.

### Composition over inheritance

Kontekst: `application`

```ts
type PasswordHasher = {
  hash: (value: string) => Promise<string>;
};

class RegisterUser {
  constructor(private readonly passwordHasher: PasswordHasher) {}
}
```

## Referansebruk

- Ved designvalg: start i skillen (`docs/skills/object-oriented-programming.skill.md`).
- Ved begrepsoppslag: bruk denne referansen.
- Ved konflikt mellom referanse og bruk: skillen gjelder.
