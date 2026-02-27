# Agents Checklist

Last reviewed: 2026-02-26

## Før implementasjon

- [ ] Startet i `docs/README.md`
- [ ] Identifisert relevante skills/policies
- [ ] Mappet oppgaven til riktig rad i `docs/reference/skill-routing-matrix.md`
- [ ] Fullført pre-execution protocol (skills, docs, constraints, risiko, forståelse)
- [ ] Avklart docs-impact

## Under implementasjon

- [ ] Ny atferd implementeres test-først
- [ ] Endring holdes liten og lag-riktig
- [ ] Relevante docs oppdateres i samme endring

## Før levering

- [ ] Oppgir hvilke docs som ble fulgt
- [ ] Oppgir hvilke regler som styrte valgene
- [ ] Oppgir hvilken skill-routing-rad som ble brukt
- [ ] Oppgir antagelser og risiko
- [ ] Oppgir hvilke docs som ble oppdatert (eller hvorfor ikke)
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
