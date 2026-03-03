# Agents Checklist

Last reviewed: 2026-02-28

## Før implementasjon

- [ ] Startet i `docs/README.md`
- [ ] Identifisert relevante skills/policies
- [ ] Mappet oppgaven til riktig rad i `docs/reference/skill-routing-matrix.md`
- [ ] Fullført pre-execution protocol (skills, docs, constraints, risiko, forståelse)
- [ ] Avklart docs-impact

## Under implementasjon

- [ ] Ny atferd implementeres test-først
- [ ] RED er bekreftet av riktig grunn før implementasjon
- [ ] Endring holdes liten og lag-riktig
- [ ] Relevante docs oppdateres i samme endring
- [ ] Ved CMS-funksjonalitet oppdateres `docs/cms-api-mvp-spec.md`, `docs/frontend-cms-mvp-spec.md` og `docs/guides/cms-mvp-implementation-workflow.md` i samme endring
- [ ] Kontraktskanter/-detaljer er testet ved API/DTO/query/valideringsendringer
- [ ] Ved frontend-endring: sjekket strukturkrav i `docs/ai-work-instructions.md` (frontend feature-structure)
- [ ] Ved oppdaget feilmodus: oppdatert relevant runbook/policy slik at samme feil kan feilsøkes deterministisk neste gang

## Før levering

- [ ] Oppgir hvilke docs som ble fulgt
- [ ] Oppgir hvilke regler som styrte valgene
- [ ] Oppgir hvilken skill-routing-rad som ble brukt
- [ ] Oppgir antagelser og risiko
- [ ] Oppgir RED-bevis (testnavn + kort failure-bevis)
- [ ] Oppgir hvilke docs som ble oppdatert (eller hvorfor ikke)
- [ ] Bekrefter at CMS API-spec + frontend-spec + workflow-guide er synkronisert ved CMS-funksjonalitet
- [ ] Oppgir om ADR ble vurdert/behov avklart
- [ ] Compliance loop kjørt (MUST-brudd, dependency rule, ny konvensjon, minimalitet)
- [ ] Leverer fast Compliance Summary-format
- [ ] Verifiserer `npm run check`

## Compliance Summary-mal

```text
Compliance Summary:
- Relevant skills:
- Skill-routing rad(er):
- MUST-regler påvirket:
- Antagelser:
- Risiko:
- Docs-impact:
- Verifisering:
```
