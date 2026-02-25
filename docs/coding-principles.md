# Coding Principles

Last reviewed: 2026-02-25

## Generelt

- Skriv liten, lesbar kode med tydelige navn
- Foretrekk små funksjoner med ett ansvar
- Unngå skjulte sideeffekter

## TypeScript

- Bruk eksplisitte typer i offentlige API-er
- Unngå `any`; bruk `unknown` og smal inn med type guards
- Håndter `null`/`undefined` eksplisitt

## Testing

- Skriv tester for domenelogikk først
- Én test skal verifisere én adferd
- Bruk beskrivende testnavn

## Operativ governance

- Følg relevante skills før kode skrives
- Prioriter minste sikre endring (unngå scope creep)
- Stopp ved doc-konflikt eller uklare krav (hard stop)
- Rapporter antagelser, risiko og docs-impact i leveranse

## Kvalitet

- Kode skal bygge og tester skal være grønne før merge
- Refaktorering skal være støttet av tester
- Dokumenter viktige beslutninger i `docs/adr/`

## Verifiseringsrekkefølge (kodeendring)

1. TDD-tester for ny atferd
2. Skill-regler (MUST/MUST NOT)
3. Dependency rule
4. Docs-impact
5. Lint/test/build i CI/lokalt
