# Engineering OS v1

Dette dokumentet gjør prinsippene operative i daglig arbeid.

## Formål

- Sikre at TDD, Clean Code og Clean Architecture faktisk følges
- Redusere feil fra både mennesker og AI-agenter
- Skape forutsigbar kvalitet gjennom automatiske guardrails

## Beslutningstre (kortversjon)

1. Er dette ny atferd?
   - Ja -> start med test (RED -> GREEN -> REFACTOR)
2. Er dette forretningsregel som gjelder uansett use-case?
   - Ja -> `domain`
3. Er dette orkestrering av en konkret handling?
   - Ja -> `application`
4. Er dette IO/integrasjon (DB, HTTP, filer, WordPress, UI)?
   - Ja -> `infrastructure` eller `interface`

Hvis du er i tvil om lagplassering: stopp, forklar antakelse, velg minste trygge endring.

## Operativ sjekkliste per endring

- Hvilken ny atferd eller feil håndteres?
- Hvilket lag tilhører endringen?
- Er dependency rule fortsatt intakt?
- Er endringen liten og testbar?
- Er berørt dokumentasjon oppdatert (minimum: relevante filer i `docs/`, og ADR ved arkitekturvalg)?
- Har build, lint og test passert?

## Teamets standard-ordre

1. Skriv/oppdater test
2. Implementer minimal løsning
3. Refaktorer trygt
4. Kjør `npm run check`
5. Oppdater docs for alle kodeendringer (og ADR ved arkitekturvalg)

## Architecture fitness functions (obligatoriske)

Dette er automatiske sjekker som må være grønne:

- Import-regler via ESLint boundaries (`domain` kan ikke importere ytre lag)
- Test + coverage via Vitest
- Build via TypeScript-kompilering

Operativ kommando: `npm run check`.

Hvis en fitness function feiler, skal endringen ikke merges.

## Guardrails i repoet

- Docs-guard håndhever docs-oppdatering ved kodeendringer
- Lint-regler håndhever importretning
- Pre-commit kjører lint-staged + relevante tester
- CI kjører docs-guard -> lint -> test -> build
- Coverage håndheves midlertidig på 100% globalt (se `docs/testing-strategy.md`)

Dette gjelder både menneskelige bidrag og AI-genererte endringer.

## Hard stop

Stopp og korriger før merge hvis en av disse oppstår:

- `domain` importerer ytre lag
- ny atferd uten test
- store endringer uten tydelig lagansvar
- arkitekturendring uten kort begrunnelse/ADR

## Definisjon av ferdig (operativ)

En endring er klar når:

- ny atferd er testet
- ansvar er i riktig lag
- ingen lagbrudd i imports
- lint/test/build er grønne
- relevante docs er oppdatert eller eksplisitt vurdert som uendret
- risiko er beskrevet kort i PR
