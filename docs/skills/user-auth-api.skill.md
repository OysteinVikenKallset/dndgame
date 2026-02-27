# Skill: Auth & User API (Opprette bruker, logge inn/ut, oppdatere bruker)

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-24

## Mål

Bygge et sikkert, testbart og vedlikeholdbart API for:

- opprette bruker
- logge inn
- logge ut
- hente/oppdatere brukerprofil
- (valgfritt) deaktivere/slette bruker

API-et skal følge TDD, Clean Code og Clean Architecture i praksis.

Auth er sikkerhetskritisk. "Funker" er ikke nok - det må være robust, testbart og vanskelig å misbruke.

## Når den brukes

- Ved implementasjon av nye auth/user-endepunkter
- Ved endringer i login/session/token-flyt
- Ved endringer i brukerdata og tilgangskontroll
- Ved review av PR-er og AI-generert kode

## Kjerneprinsipper

- Sikkerhet først (må aldri brytes)
- Domene-regler i `domain`, transport i `interface` (må aldri brytes)
- Én tydelig kontrakt per endpoint (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Auth-data behandles som sensitiv
   - Passord lagres aldri i klartekst.
   - Token/credentials logges aldri.
   - Feilmeldinger skal ikke lekke intern informasjon.

2. Domene beskytter invariants
   - E-postformat, unik e-post, gyldige statusoverganger og lignende valideres i `domain`.
   - Ugyldige tilstander skal ikke kunne representeres.

3. Konsistent auth-semantikk
   - Ugyldig innlogging returnerer konsistent svar (`401`).
   - Uautorisert tilgang returnerer `401`, manglende rettighet returnerer `403`.
   - Valideringsfeil returnerer `400`.

4. Endpoint-kontrakter er eksplisitte
   - Request/response DTO-er defineres tydelig i `interface`.
   - Mapping til/fra domain skjer ved laggrense.

5. Minste nødvendige data
   - Returner bare felter klienten trenger.
   - Eksponer aldri `passwordHash`, interne nøkler eller tekniske metadata uten behov.

## Trusselmodell (minimum)

Løsningen skal håndtere/mitigere:

- credential stuffing / brute force
- session fixation / token theft
- user enumeration via feilmeldinger
- CSRF (ved cookie-basert auth)
- XSS-risiko i klientflyt
- replay av refresh tokens (hvis refresh brukes)
- logging av passord/tokens ved uhell

Hvis en løsning gjør ett av punktene enklere å misbruke: stopp og redesign.

## Terminologi og ansvar

AuthN (autentisering): hvem er du?

AuthZ (autorisasjon): hva får du gjøre?

Hold disse separert i både kode og begreper.

## Account & session invariants

- Definer `UserStatus` eksplisitt (f.eks. `ACTIVE | DISABLED | DELETED_PENDING`).
- Login skal alltid sjekke status, ikke bare credentials.
- Deaktivert bruker skal ikke kunne logge inn.
- "Sletting" er soft delete i MVP; hard delete krever egen policy/ADR.
- Endring av passord skal invalidere eksisterende sessions.

## Valg av session/token-strategi (må dokumenteres)

Velg én strategi og bruk den konsekvent:

Alternativ A: Cookie-basert session (anbefalt for web-app)

- server oppretter session-id og lagrer session server-side
- cookie: `HttpOnly`, `Secure` (i prod), `SameSite`
- vurder CSRF-beskyttelse for unsafe requests

Alternativ B: JWT access + refresh (mer komplekst)

- kort levetid på access token
- refresh token roteres og kan revokes
- refresh lagres sikkert (helst `HttpOnly` cookie)

Hard rule: ikke lagre tokens i `localStorage` uten eksplisitt, dokumentert behov.

## Session/cookie-kontrakt (må defineres før implementasjon)

- Cookie-navn skal være eksplisitt definert (konvensjon per miljø).
- Cookie policy: `Path=/`, `HttpOnly`, `SameSite=Lax` (typisk), `Secure` i prod.
- Login setter session-cookie, logout cleares cookie.
- `GET /api/auth/me` krever gyldig session.

## CSRF-regel (hvis cookies brukes)

Unsafe metoder (`POST/PATCH/DELETE`) må beskyttes med:

- `SameSite` + origin/same-origin checks, og/eller
- CSRF-token-strategi (double-submit eller server-side).

Valgt strategi dokumenteres i ADR.

## Standard endpoint-sett (MVP)

Auth:

- `POST /api/auth/register`
  - Oppretter bruker
  - `201` ved suksess, `409` ved duplikat e-post

- `POST /api/auth/login`
  - Autentiserer bruker
  - `200` med token/session, `401` ved ugyldige credentials

- `POST /api/auth/logout`
  - Invaliderer session/token (eller klientinstruks ved stateless strategi)
  - `204` ved suksess

- `GET /api/auth/me`
  - Returnerer profil for innlogget bruker
  - `200` ved suksess, `401` uten gyldig auth

User:

- `PATCH /api/users/me`
  - Oppdaterer tillatte profilfelt
  - `200` ved suksess, `400` ved valideringsfeil

Regel: "me"-endepunkter er tryggere og enklere enn `users/:id` i starten.

## Ansvarsfordeling per lag

Domain:

- `User`-entitet, e-post/bruker-id value objects
- invariants (gyldig e-post, brukerstatus, etc.)
- domene-regler for oppretting/oppdatering
- ingen IO og ingen kjennskap til HTTP/DB/JWT-libs

Application:

- use-cases: `registerUser`, `loginUser`, `logoutUser`, `getMyProfile`, `updateMyProfile`
- (senere) `changePassword`, `requestPasswordReset`, `resetPassword`
- orkestrering av porter (repo, hasher, token/session)
- transaksjonsgrense per use-case

Infrastructure:

- repository-implementasjon
- password hasher
- token/session-adapter
- eventuelle eksterne identitetsintegrasjoner

Interface:

- HTTP-ruter/controllers
- DTO-validering og mapping
- statuskoder og responskontrakter
- auth middleware/guard som bygger `AuthContext`

## Operativ arbeidsflyt

1. STEP 1: Definer én endpoint-atferd (minste case)
2. STEP 2: Skriv feilet test (RED)
3. STEP 3: Bekreft feil av riktig grunn
4. STEP 4: Implementer minimal løsning (GREEN)
5. STEP 5: Refaktorér trygt (uten atferdsendring)
6. STEP 6: Bekreft grønt + coverage + kontrakt

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hard Stop-regel

Stopp umiddelbart hvis:

- passord/tokens håndteres usikkert
- `domain` importerer `interface`/`infrastructure`
- endpoint svarer med inkonsistent auth-feilkode
- ny atferd implementeres uten test først
- login-feil avslører "user not found" vs "wrong password"
- tokens lagres i usikkert klientlager uten dokumentert valg
- nytt endpoint innføres uten eksplisitt authz-regel

## Hva "bekreftelse" betyr

Gyldig bekreftelse for auth/user-endringer krever:

- grønn test for ny atferd
- korrekt statuskode + responskontrakt
- ingen lagbrudd i imports
- ingen sensitive data i respons/logg

## Regler (må/skal)

- Må: passord hashes før lagring.
- Må: login-feil skal være generisk (ikke avsløre om bruker finnes).
- Må: auth-sjekk skal være konsistent på beskyttede endepunkter.
- Må: minste privilegium skal håndheves (ingen implisitt tilgang).
- Skal: bruk idempotent oppførsel der naturlig (f.eks. logout).
- Skal: bruk eksplisitte DTO-er per endpoint.

## DTO-regel

- Request/response-DTO-er er transportkontrakter i `interface`.
- Domain-modeller skal ikke returneres direkte som API-respons.
- Mapping ved laggrense er obligatorisk.

For `PATCH /api/users/me`:

- bruk eksplisitt allowlist (f.eks. kun `displayName`, `avatarUrl`)
- avvis ukjente felter for å hindre mass assignment

## E-post normalisering og unikhet

- E-post normaliseres konsistent (`trim + lowercase`) før lagring og login-søk.
- Unikhet håndheves i database med unique index (ikke kun i applikasjonskode).
- Register skal håndtere race conditions (konkurrerende requests): DB avgjør, API returnerer `409`.

## Feilhåndtering skal være konsistent

- Valideringsfeil: `400`
- Uautentisert: `401`
- Ikke autorisert: `403`
- Ressurskonflikt (f.eks. duplikat e-post): `409`
- Rate limit: `429`
- Uventet feil: `500` med generisk melding

Ikke bland feilmønstre uten dokumentert grunn.

## Sikkerhetskrav (minimum)

- Hash passord med robust algoritme (f.eks. `argon2`/`bcrypt` i produksjon)
- Passordpolicy: minimum lengde 12 tegn, og definert maksgrense for å redusere hashing-DoS.
- Rate limiting på login-endepunkt
- Rate limiting på register-endepunkt
- Enkel lockout/throttling-strategi ved gjentatte feil
- Input-validering på alle eksterne innganger
- Ikke logg hemmeligheter
- Token/session-expiry skal være tydelig definert
- Logout skal invalidere server-side session/token der mulig
- Cookie-flagg i prod: `HttpOnly`, `Secure`, `SameSite`
- Audit logging av auth-hendelser uten sensitiv data

## Logging-policy (operativ)

Forbudt å logge:

- passord og `passwordHash`
- tokens, session-id, auth headers
- hele request body på auth-endepunkter
- unødvendig PII (masker e-post når mulig)

Tillatt audit minimum:

- `eventType` (f.eks. `LOGIN_SUCCESS`, `LOGIN_FAIL`, `LOGOUT`)
- `userId` (hvis kjent)
- timestamp
- IP i redusert form (hash eller siste oktett)
- user-agent (valgfritt)

## Rate limiting-regel

- Rate limiting på login må måles både per IP og per identifier (e-post/brukernavn).
- Kun per IP er ikke tilstrekkelig.
- Ved limit returneres `429` med generisk melding.

## Forbudte handlinger

- Lagring av passord i klartekst
- Returnere forskjellig feilmelding for "bruker finnes ikke" vs "feil passord"
- Forretningsregler i controller/rute
- Direkte DB-kall fra `domain`
- Generisk "UserService" uten klart ansvar
- Logging av passord, tokens eller hele request-body ukritisk
- Endre auth-strategi uten ADR

## Anti-overengineering-regel

Følgende er ikke tillatt uten dokumentert behov:

- komplett IAM-rammeverk for enkel MVP
- overgeneriske repository-/auth-abstraksjoner
- for mange token-typer/flows før konkret behov
- komplisert policy-motor i første versjon

## Abstraksjonstest (før ny abstraksjon)

Før ny auth-abstraksjon legges til, svar:

- finnes minst to reelle implementasjoner/brukere?
- reduserer dette kompleksitet i use-cases?
- forenkler det lesing og sikkerhetsevaluering?

Hvis nei, vent med abstraksjonen.

## Teststrategi per lag

Domain:

- tester invariants (e-post, status, regler)
- tester at ugyldige tilstander avvises

Application:

- tester use-cases med mockede porter
- dekker suksess + feilflyt (`401/409/...` semantikk)
- verifiserer anti-enumeration og authz-scenarioer

Infrastructure:

- tester repo/hasher/token-adaptere isolert
- integrasjonstester for faktisk persistens ved behov

Interface:

- kontrakttester for statuskoder + responsbody
- auth middleware/guard-tester

Policy: prioriter branch-dekning i domain/use-cases fremfor å jage kun global coverage-prosent.

## Endpoint testpolicy (minimum)

For hvert endpoint:

- minst 1 happy-path test
- minst 1 auth-fail test (der relevant)
- minst 1 validation-fail test (der relevant)

For login i tillegg:

- test at status/feilmelding er identisk for `user-not-found` og `wrong-password`.

## Kvalitetskriterier

- Kriterium 1: Ny endpoint-atferd er testet først.
- Kriterium 2: Statuskoder er konsistente med policy.
- Kriterium 3: Ingen sensitiv data lekker i respons/logg.
- Kriterium 4: Dependency rule holdes mellom lag.
- Kriterium 5: Coverage/CI-krav er oppfylt.
- Kriterium 6: Rate limiting finnes for auth-endepunkter.
- Kriterium 7: Logout invaliderer session/token korrekt.

## Granularitetsregel

Én iterasjon skal være liten:

- én endpoint-atferd per syklus
- minimal diff
- lav sikkerhetsrisiko

## Definisjon av ferdig

En auth/user-endring er ferdig når:

- atferd er implementert med TDD-syklus
- sikkerhetskrav over er verifisert
- kontrakttester og lagtester er grønne
- ingen lagbrudd eller forbudte handlinger finnes
- minst én negativ test finnes for hver kritisk gren (wrong password / unauthorized / conflict)

Session-invalidering:

- logout invaliderer aktiv session
- "logout all devices" er planlagt som egen use-case (senere)
- ved refresh-strategi må gamle refresh tokens kunne revokes

## Operativ kontrakt for AI-agenter

Agenten skal:

- alltid navngi lagplassering for endringen
- eksplisitt angi endpoint-kontrakt som endres
- alltid teste feilflyt (ikke bare suksess)
- eksplisitt sjekke for datalekkasjer i respons/logg
- unngå overengineering i auth-flyt

Agenten skal alltid inkludere minst:

- én suksess-test
- én feilflyt-test
- én authz-test (når relevant)

Ekstra streng variant:

- Ikke innfør JWT/refresh/roller før konkret behov er dokumentert.
- Stopp ved uklare krav og avklar tidlig (f.eks. cookie-session vs JWT).

## Direktehet-prinsippet

Foretrekk:

- tydelig request -> use-case -> domain -> response-flyt
- eksplisitte mapper mellom DTO og domain
- enkle, verifiserbare auth-regler

Unngå:

- skjult auth-logikk i middleware uten tester
- diffuse "manager/service"-klasser
- implicit sideeffekt som ikke dekkes av test

## Vanlige feil

- all auth-logikk i controller
- inkonsistente statuskoder
- manglende test av negative scenarioer
- lekkasje av interne felter i API-respons
- for tidlig introduksjon av kompliserte auth-mønstre

## ADR-minimum for auth

Når auth-strategi velges eller endres, ADR skal svare på:

- Hvilken strategi brukes (cookie-session eller JWT/refresh)?
- Hvor lagres session/refresh?
- Hvordan invalides logout?
- Hvordan håndteres CSRF?
- Hvilke cookie-flagg brukes i prod?
- Hvordan implementeres rate limiting?

## Endringslogg

- 2026-02-24: Opprettet
- 2026-02-24: Utvidet med trusselmodell, auth-strategi, security-by-default og strengere AI-guardrails
- 2026-02-24: Skjerpet med konto-/session-invariants, cookie/CSRF-kontrakt, e-postnormalisering, logging/rate-limit-regler og endpoint-testpolicy
- 2026-02-25: Oppdatert status etter implementasjon av cookie-basert `login`/`logout`/`me` med server-side session-invalidering
- 2026-02-25: Oppdatert etter implementasjon av `PATCH /api/users/me` med allowlist-validering og full dekning i test/coverage
- 2026-02-25: Oppdatert etter implementasjon av rate limiting på `register`/`login` (`429`, 5 per 10 min, nøkkel `ip+email`)
