# Agents Constitution

Last reviewed: 2026-02-25

## Purpose

Kort, autoritativ kontrakt for AI-agenters arbeid i repoet.

## Operating Rules

- MUST følge relevante skills i `docs/skills/`
- MUST følge `ai-agent-doc-compliance.skill.md` som global governance-skill
- MUST følge TDD ved ny atferd
- MUST oppdatere relevante docs i samme endring som kode
- MUST rapportere hvilke docs som ble fulgt
- MUST NOT endre arkitektur/auth-kontrakter uten ADR-vurdering

## Stop Conditions

- Docs og kode er i konflikt
- Krav er uklare eller motstridende
- Relevant doc mangler for endringen
- Endring bryter MUST-regel i skill/policy

## Required Output per levering

- Hva som ble endret
- Hvilke docs som ble brukt og/eller oppdatert
- Hvilke regler (MUST/SHOULD) som styrte valgene
- Hvilke antagelser som ble gjort
- Hvilke risikoer som er identifisert
- Hva som er verifisert (lint/test/build)
