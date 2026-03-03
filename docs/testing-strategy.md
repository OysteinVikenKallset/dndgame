# Testing Strategy

## Testpyramide-policy

- Mest: raske unit-tester i `domain`
- Deretter: use-case-tester i `application`
- Færrest: integrasjonstester i `infrastructure` og contract/e2e i `interface`

Unngå å bygge teststrategien rundt kun e2e-tester.

## Per lag

### Domain

- Test ren logikk uten IO
- Høy dekning av regler og invariants

### Application

- Test use-cases med mockede porter
- Verifiser orkestrering, feilflyt og transaksjonsgrenser

### Infrastructure

- Integrasjonstester for adaptere mot faktiske avhengigheter
- Verifiser mapping mellom porter og tekniske klienter

### Interface

- API/HTTP-kontraktstester
- UI-tester for brukerflyt (når UI finnes)

## Coverage-mål per lag

- `domain`: 95-100% (høyeste prioritet)
- `application`: 85-95% + dekning av kritiske branches
- `interface`: 70-85% (kontrakt og feilflyt)
- `infrastructure`: 60-80% for rene adaptere (resten dekkes via integrasjon)

## Midlertidig streng policy

- Inntil videre håndheves 100% coverage globalt via `vitest`-thresholds i CI og lokalt.
- Dette er en bevisst streng guardrail for tidlig fase.
- Ved behov kan terskler senere justeres til lagvise mål, men kun via dokumentert beslutning (ADR).

Merk: Coverage er et styringssignal, ikke et mål i seg selv. Kvalitet vurderes også på om feilflyt og kritisk atferd er dekket.

## Minstekrav før merge

- Nye/endrede regler har tester
- Ny/endret atferd dokumenterer RED -> GREEN (test-først)
- Kontraktsendringer inkluderer minst én test for kontraktskant/-detalj (ikke kun happy path)
- `npm test` passerer
- Kritiske use-cases har minst én test

## Kontraktskanter (obligatorisk fokus)

Ved API/DTO/query/valideringsendringer skal testsettet eksplisitt dekke kontraktskanter, spesielt:

- min/maks-grenser (f.eks. `limit`, `pageSize`, lengde/size)
- ukjente felter/query-parametre
- ugyldige enum-/statusverdier
- manglende obligatoriske felter

Manglende kontraktskant-dekning regnes som utilstrekkelig testgrunnlag før merge.
