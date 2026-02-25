# Guide: Feilsøking av docs-guard

Last reviewed: 2026-02-25

## Purpose

Gi en rask og praktisk oppskrift når `docs-guard` blokkerer commit eller CI.

## Når brukes denne guiden

- Når `npm run docs:guard` feiler lokalt
- Når `npm run docs:guard:ci` feiler i CI
- Når pre-commit stopper pga manglende docs-oppdatering

## Hurtigsjekk

1. Kjør `npm run docs:guard` lokalt.
2. Les feilmeldingen fra `[docs-guard]`.
3. Match meldingen mot tabellen under.
4. Gjør minimal fix.
5. Kjør `npm run docs:guard` igjen.

## Vanlige feil og fix

### Feil: `Code changes require docs updates in the same change set.`

Dette betyr at du har endret `src/**/*.ts`, men ingen filer i `docs/` er med i samme endringssett.

**Fix:**

- Oppdater relevante docs i `docs/` i samme commit/PR.
- Typiske kandidater: `docs/agent-memory.md`, API-spec, skill eller guide.

### Feil: `Adding a new skill requires required docs index updates.`

Dette betyr at ny `docs/skills/*.skill.md` er lagt til uten nødvendige indeksoppdateringer.

**Fix:**

- Oppdater `docs/skills/README.md` med ny skill.
- Oppdater `docs/README.md` med lenke/omtale av skillen.

## CI-spesifikk feilsøking

Hvis CI feiler på `docs:guard:ci`, sjekk at PR-en faktisk inneholder docs-endringene:

- verifiser at docs-filene er committed
- verifiser at skill-indeksene er oppdatert ved nye skills
- push ny commit og kjør CI på nytt

## Minste tillatte fix-prinsipp

- Gjør kun docs-endringer som er nødvendige for å tilfredsstille regelen.
- Unngå å blande inn urelatert refaktorering av docs.

## Relaterte dokumenter

- `docs/skills/project-documentation-system.skill.md`
- `docs/engineering-os-v1.md`
- `docs/ai-work-instructions.md`
