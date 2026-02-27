# User/Auth API MVP Spec

Dette dokumentet er en konkret kontrakt for første versjon av bruker/auth-API.

Strategi i MVP: cookie-basert session (secure-by-default).

## Implementasjonsstatus (2026-02-25)

- Implementert: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PATCH /api/users/me`
- Session-cookie i kode: `sessionId`
- Login setter `Set-Cookie` med `Path=/`, `HttpOnly`, `SameSite=Lax`
- Logout invaliderer session server-side og sender clear-cookie (`Max-Age=0`)
- Rate limiting implementert for `register` og `login`: `5` requests per `10` minutter, nøkkel `ip + normalized email`, respons `429` med generisk feil
- Gjenstår i MVP-sikkerhet: eksplisitt CSRF-strategi

## Felles regler

- Content-Type: `application/json`
- Auth-feil skal være konsistente og ikke lekke intern informasjon.
- Alle feilresponser følger format:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Kort, klientvennlig melding"
  }
}
```

- Alle suksessresponser med body følger format:

```json
{
  "data": {}
}
```

- Ingen respons skal eksponere `passwordHash` eller andre hemmeligheter.
- E-post normaliseres med `trim + lowercase` før lagring og login-søk.
- Unikhet for e-post håndheves i DB med unique index; konflikt returnerer `409`.

## Session/cookie-kontrakt

- Cookie-navn defineres eksplisitt ved implementasjon.
- Cookie policy: `Path=/`, `HttpOnly`, `SameSite=Lax`, `Secure` i prod.
- Login setter cookie, logout cleares cookie.
- `GET /api/auth/me` krever gyldig session-cookie.

Nåværende implementert cookie-navn: `sessionId`.

## CSRF-regel (cookie-basert auth)

Unsafe metoder (`POST`, `PATCH`, `DELETE`) beskyttes med:

- `SameSite` + origin/same-origin checks, og/eller
- CSRF token-strategi.

## 1) Opprett bruker

### Endpoint

`POST /api/auth/register`

### Request

```json
{
  "email": "alice@example.com",
  "password": "very-strong-password",
  "displayName": "Alice"
}
```

### Success (`201`)

```json
{
  "data": {
    "id": "user-1",
    "email": "alice@example.com",
    "displayName": "Alice"
  }
}
```

### Feil

- `400` ugyldig input
- `409` e-post finnes allerede
- `429` rate limit

## 2) Login

### Endpoint

`POST /api/auth/login`

### Request

```json
{
  "email": "alice@example.com",
  "password": "very-strong-password"
}
```

### Success (`200`)

```json
{
  "data": {
    "user": {
      "id": "user-1",
      "email": "alice@example.com",
      "displayName": "Alice"
    }
  }
}
```

I tillegg settes session-cookie.

### Feil

- `400` ugyldig input
- `401` ugyldige credentials
- `429` rate limit

`401` skal være identisk for `user-not-found` og `wrong-password`.

## 3) Logout

### Endpoint

`POST /api/auth/logout`

### Request

Gyldig session-cookie.

### Success (`204`)

Tom body.

Session invalideres server-side og cookie cleares.

### Feil

- `401` manglende/ugyldig session

## 4) Hent egen profil

### Endpoint

`GET /api/auth/me`

### Request

Gyldig session-cookie.

### Success (`200`)

```json
{
  "data": {
    "id": "user-1",
    "email": "alice@example.com",
    "displayName": "Alice"
  }
}
```

### Feil

- `401` manglende/ugyldig session

## 5) Oppdater egen profil

### Endpoint

`PATCH /api/users/me`

### Request

```json
{
  "displayName": "Alice Liddell"
}
```

Allowlist i MVP: kun `displayName` og `avatarUrl`.
Ukjente felter avvises (`400`) for å hindre mass assignment.

### Success (`200`)

```json
{
  "data": {
    "id": "user-1",
    "email": "alice@example.com",
    "displayName": "Alice Liddell"
  }
}
```

### Feil

- `400` ugyldig input
- `401` manglende/ugyldig session

## Valideringsminimum

- `email`: gyldig e-postformat
- `password`: minimum 12 tegn
- `password`: definert maksgrense for å redusere hashing-DoS
- `displayName`: trimmet, ikke tom

## Account/session minimums

- `UserStatus` brukes eksplisitt (`ACTIVE`, `DISABLED`, `DELETED_PENDING`).
- `DISABLED`-bruker kan ikke logge inn.
- Soft delete i MVP (hard delete senere via ADR).

## Logging- og sikkerhetskrav

Forbudt å logge:

- passord / `passwordHash`
- tokens / session-id / auth headers
- hele request body på auth-endepunkter

Tillatt audit minimum:

- `eventType`
- `userId` (hvis kjent)
- timestamp

## Rate limiting minimum

- Login og register rate-limites per IP + per identifier (email).
- Ved grense returneres `429` med generisk melding.

Nåværende implementasjon i kode:

- Endepunkter: `POST /api/auth/register`, `POST /api/auth/login`
- Vindu: `10` minutter
- Grense: `5` requests per nøkkel per endpoint
- Nøkkel: `${request.ip}:${email.trim().toLowerCase()}`
- Feilrespons: `429` med `{ "error": { "code": "RATE_LIMITED", "message": "Too many requests" } }`

## Testkrav per endpoint (minimum)

- minst 1 happy-path test
- minst 1 auth-fail test (der relevant)
- minst 1 validation-fail test (der relevant)

For login i tillegg:

- test at `user-not-found` og `wrong-password` gir identisk status/feilmelding.

## Notater for implementasjon

- Login-feil skal være generisk (`Invalid credentials`) for å unngå bruker-enumerering.
- DTO-er defineres i `interface` og mappes mot domain/application-modeller.
- Alle nye endpoint-atferder implementeres med TDD (RED -> GREEN -> REFACTOR).
- Endring av auth-strategi krever ADR.
