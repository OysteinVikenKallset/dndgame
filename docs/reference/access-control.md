# Access Control Matrix (MVP)

Last reviewed: 2026-02-26

## Formål

Gi én referanse for hvilke roller som kan utføre hvilke actions, slik at policy, tester og audit bruker samme kilde.

## Scope

- Nåværende system er single-tenant MVP.
- Scope er eksplisitt definert som `global` inntil multi-tenant er innført.

## Action Registry (MVP)

- `read`
- `create`
- `update`
- `delete`
- `publish`
- `change_role`

Nye actions kan ikke brukes før de er lagt til her og i policy.

## Policy-matrise (MVP)

| Role     | read              | create | update (own) | update (any) | delete (own) | delete (any) | publish     | change_role |
| -------- | ----------------- | ------ | ------------ | ------------ | ------------ | ------------ | ----------- | ----------- |
| `viewer` | allow (published) | deny   | deny         | deny         | deny         | deny         | deny        | deny        |
| `editor` | allow             | allow  | allow        | deny         | allow        | deny         | allow (own) | deny        |
| `admin`  | allow             | allow  | allow        | allow        | allow        | allow        | allow       | allow       |

## Notater

- Ownership evalueres før muterende handlinger.
- `change_role` krever eksplisitt høyere privilegium.
- Bruker kan aldri endre egen rolle uten eksplisitt admin-policy.

## API-semantikk for deny

- Uautentisert: `401`.
- Autentisert uten tilgang: `403`.
- Ressurs-lookup kan bruke `404` for å redusere enumeration-risiko; valg skal være konsistent per endpoint-type.

## Endringsregel

Ved endring av roller/actions skal følgende oppdateres i samme PR:

1. Dette dokumentet
2. Policy-implementasjon
3. Policy-tester og relevante endpoint-tester
4. `Relevant skills` i Compliance Summary
