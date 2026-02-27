# 0001: Strict TypeScript og Vitest

- Status: accepted
- Date: 2026-02-24

## Context

Prosjektet er i tidlig fase og skal utvikles videre med både menneskelige utviklere og AI-agenter.
For å redusere feil tidlig, gjøre kode tryggere å refaktorere, og sikre forutsigbar kvalitet, trengs et tydelig og strengt grunnoppsett.

## Decision

Vi standardiserer på:

- TypeScript med strenge kompilatorregler (`strict` + utvidede sikkerhetsregler)
- Full typesjekk av deklarasjoner (`skipLibCheck: false`)
- Vitest som standard test-rammeverk
- Bygg og test som standard kommandoer i `package.json` (`build`, `test`, `test:watch`)

## Consequences

Positive konsekvenser:

- Feil oppdages tidligere i utviklingsløpet
- Høyere kvalitet i API-er og domenelogikk
- Mer robust samarbeid mellom utviklere og AI-agenter
- Tryggere refaktorering når testdekning øker

Kostnader / trade-offs:

- Mer eksplisitt typing kan gi høyere terskel i starten
- Avhengigheter kan kreve ekstra typekonfigurasjon i streng modus
- Kompilering kan feile tidligere og oftere (som er ønsket adferd)

## Notes

Denne beslutningen kan revideres i en senere ADR dersom prosjektets behov endrer seg betydelig.
