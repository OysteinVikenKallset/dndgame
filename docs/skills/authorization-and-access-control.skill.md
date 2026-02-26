# Skill: Authorization & Access Control

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-26

## Related skills

- `user-auth-api.skill.md` (AuthN-flyt og session/token-grunnlag)
- `clean-architecture.skill.md` (plassering av regler i domain/application)
- `api-contracts-and-versioning.skill.md` (statuskode-/error-semantikk i API)
- `data-modeling-persistence.skill.md` (modellering av ownership og policy-relevante relasjoner)

## Terminologi (standard)

- `AuthN` = hvem brukeren er (innlogging/identitet).
- `AuthZ` = hva brukeren får gjøre (tilganger/policy).
- `RBAC` = rollebasert tilgang (`admin`, `editor`, `viewer`).
- `Ownership` = ressurseier-regel (hvem eier/kan endre en konkret ressurs).
- `Subject` = aktøren som utfører handlingen (bruker/systemrolle).
- `Action` = operasjonen som forsøkes (`read`, `create`, `update`, `delete`, `publish`).
- `Resource` = objektet handlingen retter seg mot (type + id + status/scope).
- `Permission` = eksplisitt tillatelse for subject/action/resource i gitt kontekst.

## Mål

Definere sikker, testbar og evolverbar tilgangskontroll for API og CMS-flyt.

Denne skillen styrer:

- rollemodell (`admin`, `editor`, `viewer`)
- resource ownership-regler
- policy-regler for hvem som kan lese/skrive/endere/slette
- audit trail for tilgangsbeslutninger og sensitive handlinger

## Når den brukes

- Ved nye endepunkter som krever autorisasjon
- Ved endring av roller/rettigheter
- Ved regler for eierskap til ressurser
- Ved innføring av nye policy-beslutninger (f.eks. publisering)
- Ved design av audit logging for tilgangskritiske handlinger
- Ved review av sikkerhetskritiske PR-er

## Kjerneprinsipper

- Minste privilegium gjelder alltid (må aldri brytes)
- AuthZ er eksplisitt policy, ikke implisitt adferd (må aldri brytes)
- Beslutninger skal være testbare og sporbare (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. AuthN og AuthZ holdes separat
   - Innlogging avgjør identitet, ikke tilgangsnivå alene.
   - Autorisasjon evalueres eksplisitt per handling/ressurs.

2. Default deny
   - Hvis policy mangler eller er uklar, skal tilgang nektes.
   - Ingen implicit allow i controller/use-case.

3. Rolle + ressurskontekst
   - Tilgang avgjøres av rolle, handling, ressurs og kontekst (ownership/status).
   - Rollen alene er ikke alltid nok for write-operasjoner.

4. Ownership-regler er eksplisitte
   - Eierskap skal modelleres med tydelig felt/relasjon (`ownerId` eller tilsvarende).
   - Ownership skal valideres før muterende handlinger.

5. Audit trail for sensitive handlinger
   - Kritiske AuthZ-beslutninger og endringer skal logges uten hemmeligheter.
   - Logging skal støtte etterprøving og hendelsesanalyse.

## Rollemodell (MVP-default)

Default roller:

- `admin`: full administrativ tilgang innen definert scope
- `editor`: kan opprette/endre publiserbart innhold innen policy
- `viewer`: lesetilgang uten muterende operasjoner

Regler:

- Rollehierarki skal være eksplisitt dokumentert.
- Nye roller krever policy-oppdatering (og ADR-vurdering ved varig kompleksitet).

## Action Registry (obligatorisk)

MUST:

- Alle actions skal defineres i en sentral allowlist (Action Registry).
- Nye actions krever eksplisitt policy-definisjon før de kan brukes i kode.
- Registry skal brukes som kilde for både policy-evaluering og tester.

MUST NOT:

- Introdusere nye action-strenger ad-hoc i use-cases/controller.
- Bruke "magic strings" for actions utenfor Action Registry.

## Resource ownership

MUST:

- Eierskapsregler dokumenteres per ressurstype.
- Policy skal definere om `owner`, `editor`, `admin` kan mutere ressursen.
- Ownership-sjekk skjer før write-operasjon.

MUST NOT:

- Anta eierskap basert på klientinput alene.
- Overstyre ownership uten eksplisitt admin-policy.

Eksempelpolicy (MVP):

- `viewer`: kan lese publiserte ressurser
- `editor`: kan opprette/endre egne ressurser
- `admin`: kan endre alle ressurser

## Scope og avgrensning

MUST:

- Scope for admin/editor skal være eksplisitt definert (tenant/prosjekt/ressurstype).
- AuthZ-beslutning skal ta hensyn til scope i tillegg til rolle.
- Cross-tenant/cross-scope tilgang skal nektes som default.
- Hvis systemet er single-tenant MVP uten tenant-begrep, skal scope eksplisitt dokumenteres som `global`.

MUST NOT:

- Anta global tilgang for `admin` uten eksplisitt definert scope.
- Tolke manglende scope som `allow`.

## Policy-regler (who can edit what)

Policy skal uttrykkes eksplisitt som:

- subjekt (`role`, `userId`)
- handling (`read`, `create`, `update`, `delete`, `publish`)
- objekt (ressurstype + ressursstatus)
- beslutning (`allow`/`deny`)

Anbefalt policy-struktur:

- `AuthContext + Action + Resource -> Allow/Deny + reason`
- `reason` skal være stabil kortkode som kan testes/logges.

Reason-koder:

- `reason` MUST være maskinlesbar kode.
- `reason` MUST NOT være fritekst uten kode.
- Reason-koder må ikke endre semantikk uten breaking change-vurdering.

MUST:

- Policy-beslutning skal være deterministisk.
- Beslutning skal være gjenbrukbar (unngå duplisert regel i flere kontrollere).
- Alle muterende endepunkter skal ha eksplisitt authz-sjekk.
- Policy-evaluering skal skje via sentral policy-funksjon/service, ikke ad-hoc i controller.
- Policy-funksjoner skal være rene (ingen IO, ingen DB-kall).
- All nødvendig kontekst for policy skal sendes inn som parametere.
- `401` brukes når bruker ikke er autentisert.
- `403` brukes når bruker er autentisert, men ikke har tilgang.

MUST NOT:

- Blande forretningsregler og authz-policy tilfeldig i HTTP-lag.
- Ha ulik authz-semantikk for like handlinger uten dokumentert grunn.
- Stole på permissions/roller sendt fra klient uten server-side verifisering.
- Spre `isAdmin`-sjekker tilfeldig i kodebasen uten sentral policyregel.
- Tillate rolleendring via endpoint uten eksplisitt høyere privilegium i policy.
- Tillate at bruker endrer egen rolle uten eksplisitt admin-policy.

## Audit trail

Minstekrav for tilgangsrelevant logging:

- `eventType` (f.eks. `AUTHZ_ALLOW`, `AUTHZ_DENY`, `ROLE_CHANGED`)
- `actorUserId` (hvis kjent)
- `targetResourceType` og `targetResourceId` (hvis relevant)
- `reason`/policy-grunnlag (kort kode/tekst)
- timestamp

Minstekrav for handlinger som skal gi audit-event:

- Rolleendring (`ROLE_GRANTED`, `ROLE_REVOKED`)
- Forsøk på uautorisert mutasjon (`AUTHZ_DENY`)
- Suksessfull sensitiv mutasjon (`AUTHZ_ALLOW` for definerte handlinger)
- Endring i ownership eller tilgangsrelevante relasjoner

MUST NOT logge:

- passord/tokens/session-id
- hele request bodies med sensitivt innhold
- hemmeligheter i clear text

## Plassering i lag (Clean Architecture)

- `domain`: rolle-/ownership-invariants og policy-kjerne som er forretningsregler.
- `application`: use-case-orkestrering og kall til policy-evaluering.
- `interface`: mapping av auth-kontekst + oversetting til `401/403`.
- `infrastructure`: lagring/henting av roller, medlemskap og audit-events.

## Operativ arbeidsflyt

1. STEP 1: Definer handling + ressurs + roller i scope
2. STEP 2: Skriv policy-regel eksplisitt (allow/deny + ownership)
3. STEP 3: Skriv feilet test for deny/allow (RED)
4. STEP 4: Implementer minimal policy-evaluering (GREEN)
5. STEP 5: Verifiser `401/403`-semantikk + audit logging
6. STEP 6: Oppdater docs/policy-matrise ved regelendring

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Policy-matrise (obligatorisk referanse)

MUST:

- Alle roller og actions skal dokumenteres i policy-matrise i `docs/reference/access-control.md`.
- Nye roller/actions skal oppdatere policy-matrisen i samme endring.
- Matrisen skal være konsistent med Action Registry og implementert policy.

## Hva "bekreftelse" betyr

Gyldig bekreftelse:

- riktig beslutning for tillatt/ikke-tillatt handling
- `401/403` er korrekt brukt
- ownership-policy er håndhevet
- audit-event er logget for relevant handling

Ugyldig bekreftelse:

- tilgang virker i happy path uten negative authz-tester
- policy er implisitt i controller uten eksplisitt regel
- sensitive data logges i audit

## Regler (må/skal)

- Må: følge default deny når policy ikke er eksplisitt definert.
- Må: skille `401` (ikke autentisert) fra `403` (ikke autorisert).
- Må: dokumentere policy per kritisk handling/ressurs.
- Må: teste både allow- og deny-flyt.
- Må: ha eksplisitt authz-sjekk i alle muterende endepunkter.
- Må: holde policy-evaluering i sentral, testbar komponent.
- Må: kunne teste policy uten database/nettverk (ren policy-evaluering).
- Må: logge relevante authz-events uten sensitiv data.
- Skal: holde policyregler små, eksplisitte og gjenbrukbare.
- Skal: bruke rolle + ownership sammen der det er naturlig.

## Feilhåndtering skal være konsistent

- AuthZ-nekt skal returnere stabil feilrespons med korrekt status.
- Ikke eksponer intern policy-evaluering i detalj til klient.
- Tekniske feil i policyoppslag skal håndteres som intern feil (`500`) med trygg logging.
- For ressurs-lookup kan `404` brukes i stedet for `403` for å redusere resource-enumeration-risiko.
- Valget mellom `403` og `404` skal være konsistent per endpoint-type og dokumentert.

## Forskjell på "ny" og "endre"

Ny authz-regel:

- krever eksplisitt policy + tester + docs-oppdatering

Endring i eksisterende authz-regel:

- krever vurdering av sikkerhetsrisiko og kompatibilitet
- krever oppdatert policy-dokumentasjon og testjustering

## Hard Stop-regel

Stopp og avklar hvis:

- endpoint krever authz men policy ikke er definert
- `401`/`403`-semantikk er uklar eller inkonsistent
- ownership ikke kan bestemmes sikkert
- ny rolle legges til uten policy-matrise
- audit trail mangler for sensitiv handling
- policy er implementert ad-hoc i flere lag uten sentral evaluering
- authz-logikk kan ikke verifiseres med isolerte policy-tester

## Forbudte handlinger

- Gi tilgang basert på frontend-signal alene
- Hardkode rolle-unntak i tilfeldige kontrollere
- Behandle `401` og `403` som samme feil
- Logge hemmeligheter eller sensitiv payload i audit
- Innføre "superadmin bypass" uten dokumentert policy/ADR-vurdering

## Anti-overengineering-regel

Følgende er ikke tillatt uten dokumentert behov:

- full IAM/policy-engine for enkel CMS-MVP
- ABAC-motor med mange attributter før reelt behov
- komplekse, dynamiske policy-språk uten tydelig gevinst

## Kvalitetskriterier

- Kriterium 1: Policy er eksplisitt og dokumentert
- Kriterium 2: Allow/deny-flyt er testet
- Kriterium 3: `401/403` brukes konsekvent
- Kriterium 4: Ownership-regler håndheves
- Kriterium 5: Audit trail er tilstrekkelig og sikker

## Teststrategi (minimum)

1. Policy-tester (rask, uten infrastruktur)
   - Verifiser `Allow/Deny` for rolle + action + resource + scope.
   - Verifiser edge-cases: manglende ownership, feil scope, ukjent rolle.

2. Endepunkt-tester (HTTP-nivå)
   - Uautentisert forespørsel gir `401`.
   - Autentisert uten tilgang gir `403`.
   - Tillatt forespørsel gir forventet `2xx` og korrekt effekt.

3. Audit-verifisering
   - Sensitive beslutninger produserer forventet audit-event.
   - Eventer inneholder ikke hemmeligheter/sensitiv payload.

## Definisjon av ferdig

En authz-endring er ferdig når:

- policy og rolle/ownership-regel er dokumentert
- tester dekker minst én allow og én deny
- responssemantikk (`401/403`) er verifisert
- audit-krav er oppfylt
- docs-impact er håndtert

## Operativ kontrakt for AI-agenter

Agenten skal alltid oppgi:

- hvilke roller og handlinger som påvirkes
- hvilken ressurs/ownership-regel som gjelder
- hvilken policy-regel som brukes for beslutning
- hvilke `401/403`-cases som testes
- hvilke audit-events som logges

Agenten skal i tillegg alltid oppgi:

- hvilke scope-regler som gjelder (tenant/prosjekt/globalt)
- hvordan policy er sentralisert og hvor beslutning tas
- hvilke policy-tester som kan kjøres uten database

Agenten skal stoppe og eskalere når:

- policy er uklar, motstridende eller mangler default deny
- endpoint mangler tydelig mapping mellom AuthN-resultat og AuthZ-beslutning
- foreslått løsning krever unntak fra `401/403`-semantikk uten eksplisitt beslutning

## Endringslogg

- 2026-02-26: Opprettet
- 2026-02-26: Supplert med policy-struktur, scope-regler, teststrategi og utvidet AI-kontrakt
- 2026-02-26: Skjerpet med Action Registry, pure policy-regler, enumeration-presisering, policy-matrisekrav, privilege-escalation-vern og stabile reason-koder
