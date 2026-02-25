# Project Overview

Last reviewed: 2026-02-25

## Prosjekt

- Navn: dndgame
- Type: Node.js + TypeScript
- Test: Vitest

## Visjon

Bygge et DnD-spill med tydelig domenelogikk, høy testbarhet og enkel videreutvikling.

## Scope (nå)

- Clean Architecture-basert API (`domain`/`application`/`infrastructure`/`interface`)
- Auth-flyt: register, login, logout, me, update profile
- Cookie-basert session med server-side invalidering
- In-memory rate limiting for auth-endepunkter
- Strenge quality gates (lint, test, build, coverage)

## Ikke i scope (enda)

- UI/klient
- Persistens/database i produksjonsvariant
- Distribuert session-store
- Komplett CSRF-strategi utover nåværende MVP-beskyttelser

## Teknologistack

- Runtime: Node.js
- Språk: TypeScript (strenge regler)
- API: Express
- Testing: Vitest
