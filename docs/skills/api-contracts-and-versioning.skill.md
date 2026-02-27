# Skill: API Contracts & Versioning

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-26

## Related skills

- `test-drevet-utvikling.skill.md` (TDD for ny endpoint-atferd)
- `clean-architecture.skill.md` (laggrenser og DTO-mapping ved interface-grense)
- `user-auth-api.skill.md` (sikkerhetskritiske auth-kontrakter)

## Terminologi (standard)

- `API-kontrakt` = request/response-format + semantikk + statuskoder.
- `DTO` = transportmodell i `interface`/`infrastructure`, ikke domain-modell.
- `versioning` = eksplisitt strategi for kompatible/inkompatible endringer.

## Mål

Sikre at API-er er stabile, konsistente og testbare over tid.

API-kontrakten er en ekstern forpliktelse.
Implementasjonen er en intern detalj.

Når API er stabilt, kan systemet evolvere bak kontrakten.

Denne skillen styrer:

- DTO-standard
- error envelope-format
- conventions for pagination/filtering/sorting
- idempotency-regler per HTTP-metode
- versioning policy
- contract tests

## Når den brukes

- Ved opprettelse av nye API-endepunkter
- Ved endring av request/response-felt
- Ved innføring av listeresponser med pagination/filter/sort
- Ved endring av feilmeldingsformat eller statuskode-semantikk
- Ved vurdering av breaking vs ikke-breaking API-endring
- Ved etablering eller oppdatering av contract tests

## Kjerneprinsipper

- Kontrakter er eksplisitte og stabile (må aldri brytes)
- Transportmodeller er separert fra domenemodeller (må aldri brytes)
- Breaking endringer krever versjonering og migreringsplan (må aldri brytes)

## Kjerneprinsipper (supplerende)

- API-kontrakten er offentlig kontrakt for klienter
- API er source of truth for klientintegrasjoner
- Stabilitet trumfer eleganse etter publisering
- Endringer skal være eksplisitte (ingen skjulte kontraktsendringer)

## Kjerneprinsipper (må aldri brytes)

1. Én tydelig kontrakt per endpoint
   - Request/response skal være dokumentert med felt, typer og semantikk.
   - Statuskoder skal være konsistente med policy.

2. DTO ved laggrense
   - DTO-er lever i `interface` (og evt. `infrastructure`-adaptere).
   - Domain-modeller skal ikke eksponeres direkte i API-respons.

3. Feilformat skal være stabilt
   - API-feil skal følge ett konsistent envelope-format.
   - Feilresponser skal ikke lekke intern informasjon.

4. Kontrakter testes objektivt
   - Hver kontraktendring skal dekkes av contract tests.
   - Tester skal verifisere format, semantikk og statuskode.

5. Versioning er en policy, ikke ad hoc
   - Teamet skal bruke én definert strategi konsekvent.
   - Breaking endringer uten versjonering er forbudt.

## DTO-standard

MUST:

- DTO-er defineres eksplisitt per endpoint (request + response).
- Feltnavn skal være stabile og forutsigbare.
- Ubrukte eller interne felter skal ikke eksponeres.
- Mapping mellom DTO og domain/application skjer ved laggrense.

MUST NOT:

- Returnere domain-entiteter direkte.
- Gjenbruke én "mega DTO" på tvers av urelaterte endpoints.
- La transportdetaljer lekke inn i domain-laget.

## Error envelope (format)

Success envelope (standard for nye endepunkter):

```json
{
  "data": {}
}
```

Success-regler:

- Alle nye endepunkter MUST bruke `{ "data": ... }` ved respons med body.
- `204 No Content` MAY brukes når ingen responsbody er naturlig (f.eks. logout/delete).
- `204`-responser MUST NOT ha body.

Standard envelope:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Kort, klientvennlig melding"
  }
}
```

Kompatibilitetsregel:

- Eksisterende endepunkter kan beholde etablert error-shape inntil versjonert migrering.
- Nye endepunkter skal bruke standard error object.

Regler:

- Én konsistent struktur for alle feilresponser.
- `error.code` MUST være stabil, maskinlesbar verdi.
- `error.message` MAY justeres uten semantisk kontraktbrudd.
- Intern stack trace, SQL-feil eller intern infrastrukturdetalj skal aldri eksponeres.

Valideringsfeil (anbefalt standard):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [
      {
        "field": "email",
        "issue": "INVALID_FORMAT"
      }
    ]
  }
}
```

Valideringsregler:

- `details` MAY være tom.
- `details[].field` SHOULD bruke DTO-feltnavn.
- `details[].issue` SHOULD være stabil maskinkode.

Error code-taxonomi:

- `error.code` skal bruke `SCREAMING_SNAKE_CASE`.
- Koder kan være globale eller scoped per domene (f.eks. `AUTH_INVALID_CREDENTIALS`, `USER_EMAIL_TAKEN`).
- En kode MUST NOT gjenbrukes med ny semantikk.

Statuskode-semantikk (minimum):

- `400`: valideringsfeil/ugyldig input
- `401`: uautentisert
- `403`: autentisert men ikke autorisert
- `404`: ressurs ikke funnet (når relevant)
- `409`: konflikt (f.eks. duplikat)
- `429`: rate limit
- `500`: uventet feil (generisk melding)

## Pagination / filtering / sorting conventions

Ved liste-endepunkter skal konvensjon være eksplisitt.

Default query-parametre:

- `page` (1-basert)
- `pageSize`
- `sort` (f.eks. `createdAt` eller `-createdAt`)
- eksplisitte filterparametre per felt (ikke fritekst-JSON som default)

Respons ved pagination (anbefalt minimum):

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

MUST:

- Valider `page`/`pageSize` med grenser.
- Sortering skal bruke allowlist over tillatte felt.
- Filtrering skal være eksplisitt og dokumentert per endpoint.
- Ukjente query-parametre skal avvises med `400` som default policy.

Sort-regel (låst syntaks):

- `sort=field` betyr ascending.
- `sort=-field` betyr descending.

MUST NOT:

- Tillate vilkårlig sort/filter-felt uten validering.
- Bruke inkonsistente parameternavn mellom tilsvarende liste-endepunkter.

## Idempotency policy (POST vs PUT/PATCH)

- `GET`/`HEAD` skal være idempotente og uten sideeffekt.
- `PUT`/`DELETE` skal være idempotente.
- `PATCH` er ikke nødvendigvis idempotent; atferd skal dokumenteres.
- `POST` er ikke idempotent som default.

Når `POST` kan gi duplikat-risiko (f.eks. oppretting via klient-retry):

- vurder idempotency key-strategi
- dokumenter nøkkel, scope og TTL eksplisitt

## Versioning policy

Prosjektstandard (default):

- ingen versjonering før behov oppstår.

Inntil første breaking endring:

- API kan leveres uten versjonsprefix, men kontrakt må være stabil.

Ved breaking endring brukes prioritert strategi:

1. additive endringer (hvis kompatibelt)
2. nytt endpoint
3. versjonert path (`/api/v2/...`)
4. header-versioning

Regler:

- Breaking endring krever ny versjon eller eksplisitt kompatibilitetsplan.
- Ikke-breaking endringer kan leveres i samme versjon.
- Versioning-strategi skal være konsistent på tvers av hele API-flaten.

Eksempler på breaking endring:

- fjerning/rename av response-felt
- endret datatype på felt
- strengere validering som avviser tidligere gyldig input
- endret semantikk for statuskode/feilkode
- nye obligatoriske felter uten kompatibilitetsstrategi

## Breaking change-regler

Breaking changes MUST:

- dokumenteres
- varsles
- versjoneres eller migreres med eksplisitt plan
- ha tydelig klientoppgraderingsstrategi

Breaking changes MUST NOT:

- deployes stille
- skjules som "intern refaktor"

## Deprecation policy (minimum)

- Deprecated felter/endepunkter MUST merkes i docs.
- Deprecated felter/endepunkter SHOULD støttes i minst én dokumentert overgangsperiode før fjerning.

## Contract tests

MUST:

- Hvert endpoint skal ha minst én contract test for happy path.
- Hvert endpoint skal ha minst én contract test for relevant feilflyt.
- Tester skal verifisere både statuskode og responsformat.
- Tester skal verifisere obligatoriske felter.
- Tester skal verifisere at sensitive felter ikke returneres i respons.

SHOULD:

- Teste at ukjente felter avvises der allowlist-policy gjelder.
- Teste backward compatibility for ikke-breaking endringer.

MUST NOT:

- Kun teste intern implementasjon uten å verifisere ekstern kontrakt.
- Godta respons med sensitive felter (f.eks. `passwordHash`, `refreshToken`, hemmelige tokens).

## Operativ arbeidsflyt

1. STEP 1: Definer kontrakt først (DTO + statuskoder + envelope)
2. STEP 2: Klassifiser endring (breaking eller ikke-breaking)
3. STEP 3: Skriv feilet contract test (RED)
4. STEP 4: Implementer minimal endpoint-løsning (GREEN)
5. STEP 5: Bekreft contract tests + relevante lagtester
6. STEP 6: Oppdater docs/spec og versjoneringsnotat

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hva "bekreftelse" betyr

Gyldig bekreftelse:

- request/response matcher dokumentert kontrakt
- statuskoder og feilformat er konsistente
- contract tests passerer
- docs/spec er oppdatert ved kontraktendring

Ugyldig bekreftelse:

- endpoint virker lokalt uten kontrakttester
- formatendring uten oppdatert spec
- breaking endring levert uten versioning-plan

## Konsistensregler

Alle endepunkter skal:

- bruke samme error envelope
- bruke samme pagination-struktur
- bruke samme naming-konvensjon
- bruke samme casing-standard (camelCase)

## Regler (må/skal)

- Må: bruke eksplisitte DTO-er ved API-grensen.
- Må: bruke standard error envelope.
- Må: dokumentere pagination/filter/sort-konvensjon for liste-endepunkter.
- Må: klassifisere kontraktendringer som breaking/ikke-breaking.
- Må: dekke kontrakter med tester.
- Skal: følge prioritert versjoneringsstrategi definert i denne skillen.
- Skal: holde kontrakter små, tydelige og klientvennlige.

## Feilhåndtering skal være konsistent

- Feiloversettelse skjer i interface-laget.
- Uventede feil gir `500` med generisk melding.
- Feilformat skal være stabilt på tvers av endepunkter.
- Ikke swallow kontraktbrudd; de skal fanges av tester og korrigeres.

## Forskjell på "ny" og "endre"

Ny endpoint-kontrakt:

- krever eksplisitt DTO, statuskoder, feilformat og contract test

Endring i eksisterende kontrakt:

- krever kompatibilitetsvurdering
- krever oppdatert docs/spec
- krever versjoneringsvurdering ved breaking endring

## Hard Stop-regel

Stopp og avklar hvis:

- endpoint designes uten DTO-definisjon
- responsstruktur er uklar eller tvetydig
- response-format endres uten spec-oppdatering
- breaking endring foreslås uten versjoneringsplan
- error envelope avviker fra standard uten godkjent policy
- endpoint mangler contract test for kritisk flyt
- DTO og domain-modell blandes uten laggrense

## Forbudte handlinger

- Endre API-kontrakt "stille" uten docs/test
- Lekke internfeil, stack trace eller tekniske detaljer i API-feil
- Returnere domain-entiteter direkte som transportobjekter
- Returnere raw database-objekter i API-respons
- Returnere ulik responsstruktur for samme endpoint-type uten policy
- Endre feltnavn/datatype uten versjonering eller kompatibilitetsplan
- Introdusere ny versioning-strategi ad hoc per endpoint
- Bryte idempotency-semantikk uten eksplisitt dokumentasjon

## Anti-overengineering-regel

Følgende er ikke tillatt uten dokumentert behov:

- flere parallelle versioning-strategier samtidig
- generiske query-DSL-er for filter/sort i tidlig fase
- overkompleks feiltaxonomi uten klientbehov

## Kvalitetskriterier

- Kriterium 1: Kontrakter er eksplisitte, stabile og dokumenterte
- Kriterium 2: DTO-grenser er tydelige og lagriktige
- Kriterium 3: Feilformat og statuskoder er konsistente
- Kriterium 4: Breaking endringer håndteres via policy
- Kriterium 5: Contract tests verifiserer kritisk atferd

## Definisjon av ferdig

En API-kontraktendring er ferdig når:

- DTO er definert
- kontrakt er definert/oppdatert i docs
- contract tests er grønne
- error cases er testet
- breaking/ikke-breaking er eksplisitt vurdert
- versioning-implikasjoner er håndtert
- error envelope og statuskoder er konsistente

## Operativ kontrakt for AI-agenter

Agenten skal alltid oppgi:

- hvilket endpoint og hvilken kontrakt som endres
- request DTO
- response DTO
- hvilke DTO-felter som er lagt til/fjernet/endret
- hvilke statuskoder og feilresponser som gjelder
- om endringen er breaking eller ikke-breaking
- hvordan versioning håndteres
- hvilke contract tests som verifiserer endringen

Agenten skal stoppe hvis ett av punktene over ikke kan bestemmes sikkert.

## Senere modenhetsnivå

Kan innføres senere:

- OpenAPI-generering
- schema-diff detection
- backward-compatibility checker
- contract snapshot tests
- API deprecation lifecycle
- ETag/If-Match for API-nivå optimistic concurrency

## Endringslogg

- 2026-02-26: Opprettet
- 2026-02-26: Supplert med governance-regler, envelope-standard, breaking-change policy, konsistensregler og videre modenhetsnivå
- 2026-02-26: Supplert med success/204-regler, valideringsfeil-standard, error code-taxonomi, låst sort-syntaks, unknown query-policy, deprecation-minimum og response denylist
