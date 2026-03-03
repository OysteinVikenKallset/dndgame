# Project Overview

Last reviewed: 2026-02-28

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
- SQLite-basert persistens for brukere, sessions, sider og publiserte snapshots
- In-memory rate limiting for auth-endepunkter
- React + Vite admin-frontend for CMS MVP-flyt
- Strenge quality gates (lint, test, build, coverage)

## Ikke i scope (enda)

- PostgreSQL-migrering og full migrasjonspipeline for produksjon
- Distribuert session-store
- Komplett CSRF-strategi utover nåværende MVP-beskyttelser

## Teknologistack

- Runtime: Node.js
- Språk: TypeScript (strenge regler)
- API: Express
- Frontend: React + Vite
- Testing: Vitest
