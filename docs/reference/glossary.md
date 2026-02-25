# Glossary

Last reviewed: 2026-02-25

## Domain

Varige forretningsregler og modeller som er uavhengige av rammeverk.

## Application (Use-case)

Orkestrering av en konkret handling i systemet.

## Infrastructure (Adapter)

Implementasjoner mot ytre systemer (DB, HTTP, hashing, tokens).

## Interface

Inngangs-/utgangslag som mapper transportformat til/fra use-cases.

## DTO

Data Transfer Object brukt ved laggrenser, ikke som domeneobjekt.

## ADR

Architecture Decision Record som dokumenterer varige tekniske beslutninger.

## Docs-impact

Vurdering av hvilke dokumenter som må oppdateres når kode endres.

## MUST / SHOULD / MAY

RFC-stil kravspråk for normative regler i docs.

## Runtime governance

Operative mekanismer som håndhever regler i praksis for mennesker og AI (skills, sjekklister, guardrails, CI).

## Hard stop

Obligatorisk stopp ved uklarhet, regelkonflikt eller sikkerhetsrisiko før implementasjon fortsetter.

## Escalation rule

Når hard stop ikke kan avklares, skal agenten foreslå policy-tillegg, ny skill eller ADR-utkast.

## Compliance Summary

Fast leveranseformat som oppsummerer relevante skills, MUST-regler, antagelser, risiko, docs-impact og verifisering.

## Fitness function

Automatisert sjekk (f.eks. lint/test/build/import-regler) som må være grønn for å verifisere arkitektur- og kvalitetskrav.

## Pattern status: Preferred

Anbefalt standardvalg når problem og kontekst matcher.

## Pattern status: Allowed

Tillatt valg når det er begrunnet, men normalt ikke førstevalg.

## Pattern status: Discouraged

Bør som hovedregel unngås pga høy kompleksitet/risiko i denne kodebasen.

## Pattern status: Experimental

Krever eksplisitt vurdering og team-godkjenning før bruk i produksjonskode.
