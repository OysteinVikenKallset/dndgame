# Skill: Frontend Architecture & Code Quality

## Metadata

- Owner: Engineering Team
- Stability: Stable
- Last reviewed: 2026-02-27

## Related skills

- `clean-code.skill.md` (globale kvalitetsregler; dupliseres ikke her)
- `clean-architecture.skill.md` (ansvarsdeling og avhengighetsretning)
- `frontend-container-composition-and-props.skill.md` (props-disciplin, container-lesbarhet, konsolidering av selectors/derived state)
- `api-contracts-and-versioning.skill.md` (kontrakttro datahenting og feilhåndtering)
- `authorization-and-access-control.skill.md` (UI-gating vs server-autorisering)
- `test-drevet-utvikling.skill.md` (test-først for ny atferd)

## Terminologi (standard)

- `Route component` = side/layout/segment-komponent som binder route til feature.
- `Container component` = komponerer data, state, sideeffekter og event handlers.
- `Presentational component` = rendrer UI basert på props; ingen IO-sideeffekter.
- `Custom hook` = gjenbrukbar logikk med klart ansvar og eksplisitt API.
- `Server state` = data fra backend/API.
- `Local UI state` = midlertidig, visningsnær state (toggle, input, modal).
- `Global state` = delt state på tvers av features/ruter.

## Mål

Definere en operativ standard for frontend-utvikling med React/Next som er:

- konsistent strukturert per feature
- tydelig i komponentansvar
- kontrakttro i datahenting og feilhåndtering
- testbar på komponent- og feature-nivå
- robust mot vanlig frontend-kompleksitet

Denne skillen supplerer `clean-code.skill.md` med kun frontend-spesifikke regler.

## Når den brukes

- Ved nye routes/sider/layouts i React/Next
- Ved nye komponenter, hooks eller state-flyt
- Ved endring av datahenting, cache eller loading-feiltilstander
- Ved refaktorering av frontend-struktur per feature
- Ved review av AI-generert frontend-kode

## Kjerneprinsipper

- Komponentansvar skal være eksplisitt (må aldri brytes)
- Datahenting og visning skal separeres (må aldri brytes)
- State-strategi skal være bevisst per feature (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Komponenttyper skal holdes adskilt
   - `Route component` binder rute til feature.
   - `Container component` håndterer data/state/handlers.
   - `Presentational component` rendrer kun UI fra props.

2. Maks ansvar per komponent
   - En komponent skal ha ett primært ansvar.
   - Hvis komponent både henter data, gjør domene-transformasjon og rendrer kompleks UI, skal den splittes.

3. Hooks skal være smale og testbare
   - Custom hooks skal kapsle én sammenhengende logikk-enhet.
   - Hooks skal ikke skjule flere urelaterte sideeffekter.

4. State skal ha eksplisitt eier
   - Lokal state for lokal UI.
   - Server state for backend-data.
   - Global state kun når flere features/ruter faktisk trenger samme state.

5. Rendering skal være deterministisk
   - Loading/error/empty/ready skal være eksplisitt modellert.
   - JSX skal bruke guard-clauses for å unngå kompleks nesting.

6. API-kontrakt skal følges i UI
   - UI feilmapping skal bruke stabile `error.code`.
   - Fritekst-feilmeldinger brukes kun som visning, ikke som styringslogikk.

## Komponentarkitektur

For detaljerte regler om props-budget, `viewModel/actions`-kontrakter, inline-dispatch-forbud, controller-hooks og feature-scoped context, følg i tillegg `frontend-container-composition-and-props.skill.md`.

MUST:

- Definer komponenttype eksplisitt: route, container eller presentational.
- Route-komponenter skal orkestrere feature-entry, ikke inneholde tung render-/forretningslogikk.
- Container-komponenter skal samle datahenting, state og handlers for én featureflate.
- Presentational-komponenter skal være props-drevne og uten API-kall.

MUST NOT:

- Blande route/container/presentational-ansvar i én stor komponent.
- Legge API-kall direkte i presentational-komponenter.

Splitt-regel (obligatorisk):

- Komponent > ca. 200 linjer skal vurderes for splitting.
- Komponent med > 8 props eller > 3 nivåer betinget JSX skal splittes.
- Komponent som krever både omfattende sideeffekter og omfattende markup skal splittes i container + presentational.

## Hooks-struktur

MUST:

- Custom hooks er tillatt når logikk brukes minst to steder, eller når én komponent blir uforholdsmessig kompleks uten hook.
- Hook API skal være eksplisitt (input/output) og typed.
- Sideeffektfulle hooks skal ha tydelig navn (f.eks. `useLoadProfile`).
- Rene beregningshjelpere skal ligge i rene funksjoner, ikke tvinges inn i hook.

MUST NOT:

- Kalle hooks betinget.
- Legge skjult IO/business-logikk i hooks utenfor tydelig feature-kontekst.
- Lage "god hooks" som håndterer flere urelaterte domener.

Hook-regel for sideeffekt vs ren logikk:

- Sideeffekter (fetch, subscribe, navigation) skal ligge i container/hook.
- Ren transformasjon/formattering skal ligge i rene funksjoner.

## State-strategi

MUST:

- Velg state-type eksplisitt per dataelement: local UI, server state eller global state.
- Lokal state skal være default for komponentnær interaktivitet.
- Server state skal ikke kopieres til global state uten dokumentert behov.
- URL-relevant state (filter/sort/page/tab) skal ligge i URL/query når det påvirker navigasjon.

MUST NOT:

- Introdusere global state for state som kun brukes i én route/feature.
- Speile samme server state i flere konkurrerende state-kilder.
- Lagre state som kan beregnes deterministisk fra props eller annen state.

Global state er forbudt når:

- behovet kun er prop drilling over 1-2 nivåer
- state kun brukes i én featureflate
- problemet kan løses med lokal komposisjon eller feature-container

Caching-lib (f.eks. TanStack Query/SWR) er tillatt når minst ett er sant:

- samme serverdata brukes i flere uavhengige views
- re-fetch/polling/cache invalidation blir kompleks med ad hoc løsning
- optimistic update/retry-status må håndteres konsistent

Hvis ingen av disse gjelder, skal enkel fetch-strategi brukes.

## Form State

MUST:

- Form state skal eies av én komponent eller én dedikert hook.
- Valideringsstatus, submit-status og feltverdier skal ha én tydelig source of truth.

MUST NOT:

- Splitte form state over flere uavhengige state-kilder uten eksplisitt synkroniseringsstrategi.
- Duplisere samme feltverdi i parallelle statestrukturer.

## Data-henting

MUST:

- I Next: foretrekk server-side datahenting som default; bruk client-side fetch kun ved interaktivt behov.
- Datahenting skal skje i route/container/hook-lag, ikke i presentational-komponenter.
- Transformasjon fra API-shape til view-shape skal skje før rendering.
- Alle featureflater skal håndtere `loading`, `error`, `empty`, `ready` eksplisitt.
- Håndter stale responses / race conditions når flere requests kan overlappe.

SHOULD:

- Bruke streaming/Suspense i Next når det gir bedre brukeropplevelse uten å øke logisk kompleksitet.

MUST NOT:

- Gjøre API-kall i render-flyt uten eksplisitt kontroll.
- Blande rå API-shape direkte inn i kompleks JSX.
- La domain-modell lekke direkte inn i presentational-komponenter når view-shape avviker.

## Rendering-regler

MUST:

- Bruk guard-clauses tidlig i komponent for `loading/error/empty`.
- Hold betinget rendering eksplisitt og lesbar; foretrekk navngitte mellomvariabler ved kompleksitet.
- Liste-rendering skal bruke stabile nøkler fra domenedata.

MUST NOT:

- Bruke array-indeks som `key` når stabil id finnes.
- Legge inline business-logikk i JSX-uttrykk.
- Lage dyp nestet ternary for sentrale UI-tilstander.
- Trigge sideeffekter under rendering (logging, fetch, mutation, navigation).
- Bruke `useMemo`/`useCallback` uten dokumentert re-render-problem.

Deterministisk rendering-regel:

- Samme props + state skal gi samme UI-output.

## Struktur og filorganisering

MUST:

- Organiser frontend per feature med tydelig route-entry.
- Bruk konsistente navn:
  - komponenter: `PascalCase.tsx`
  - hooks: `use-*.ts` eller `use*.ts` (én valgt konvensjon per repo)
  - hjelpefunksjoner: `kebab-case.ts`
  - tester: `*.test.ts(x)` nær feature eller i tydelig testmappe

- Hold filer små nok til å reviewes effektivt.

Heuristikker (skal trigge refaktor-vurdering):

- komponentfil > ca. 250 linjer
- hook-fil > ca. 150 linjer
- mer enn én komponent + betydelig sideeffektlogikk i samme fil

MUST NOT:

- Lage "misc/components/utils"-samlemapper uten feature-eierskap.
- Blande route-komponenter og generiske shared-komponenter uten tydelig grense.

## Anti-patterns

Følgende skal behandles som anti-patterns i frontend-kode:

- store komponenter med blandet ansvar (route + data + rendering + policy)
- prop drilling over mange nivåer uten vurdert alternativ
- inline business logic i JSX
- custom hooks som skjuler flere urelaterte sideeffekter
- overabstraksjon (generisk komponentrammeverk uten reelt behov)

## Performance invariants

MUST:

- UI-respons skal ikke blokkere på ikke-kritisk data.
- Kritiske interaksjoner skal ikke trigge full page re-render uten eksplisitt begrunnelse.

## Debuggability

MUST:

- Komponent- og hook-struktur skal være sporbar i React DevTools.

MUST NOT:

- Skjule sentral dataflyt bak ugjennomsiktige abstraksjoner som vanskeliggjør feilsøking.

## Testing (frontend)

MUST:

- Frontend-kode skal designes slik at presentational-komponenter kan testes isolert med props.
- Container/hooks skal kunne testes med kontrollerte avhengigheter og deterministisk input.
- Test kritisk brukerflyt per feature (happy path + minst én feilflyt).
- Test mapping av sentrale `error.code`-tilstander til riktig UI-respons.
- Test `loading/error/empty/ready` i minst én representativ featureflyt.

SHOULD:

- Ha snapshot-tester kun for stabile, små presentational komponenter.
- Ha minst én integrasjonstest for route-nær featureflyt der risiko er høy.

MUST NOT:

- Gjøre tester skjøre ved å asserte på irrelevante DOM-detaljer.
- Erstatte adferdstesting med snapshots alene.

## Operativ arbeidsflyt

1. STEP 1: Avklar feature-scope, route-ansvar og API-kontrakt
2. STEP 2: Velg state-strategi (local/server/global) og begrunn eventuelt global state
3. STEP 3: Definer komponentgrenser (route/container/presentational) + hook-ansvar
4. STEP 4: Skriv feilet test for ny brukeradferd (RED)
5. STEP 5: Implementer minste fungerende flyt med eksplisitte UI-tilstander (GREEN)
6. STEP 6: Verifiser testbarhet, kontrakt, og docs-impact

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hva "bekreftelse" betyr

Gyldig bekreftelse:

- brukerflyt fungerer for happy path og relevant feilflyt
- API-feil mappes deterministisk via `error.code`
- komponentgrenser er tydelige (`route` / `container` / `presentational`)
- tester verifiserer både isolert logikk og representativ featureflyt

Ugyldig bekreftelse:

- kun visuell inspeksjon uten tester
- UI fungerer kun i happy path
- state-/hook-design kan ikke forklares med eksplisitt ansvar

## Regler (må/skal)

- Må: klassifisere komponenter som `route`, `container` eller `presentational`.
- Må: eksplisitt velge state-strategi per feature.
- Må: holde fetch i route/container/hook-lag.
- Må: håndtere loading/error/empty/ready deterministisk.
- Må: sikre at kritisk UI-logikk kan testes isolert.
- Skal: holde props-APIer små og tydelige.
- Skal: foretrekke enkel komposisjon før ny abstraksjon.

## Hard Stop-regel

Stopp og avklar hvis:

- frontend-endring krever ny global state-løsning uten dokumentert smerte
- API-kontrakt er uklar eller motsier UI-behov
- samme komponent får flere uavhengige ansvar (route + data + presentasjon)
- rendering-policy blir så kompleks at guard-clauses ikke lenger gir lesbar flyt
- løsning krever cascading `useEffect`-kjeder for grunnleggende dataflyt

## Forbudte handlinger

- Innføre ny frontend-rammeverkstack uten beslutning/ADR.
- Blande autorisasjonslogikk tilfeldig i UI som sikkerhetsmekanisme.
- Lage generiske komponent-rammeverk for hypotetiske behov.
- Legge inline business-regler direkte i JSX.
- Introdusere global state for å unngå moderat prop drilling.
- Bruke indeks som `key` i dynamiske lister når stabil id finnes.

## Anti-overengineering-regel

Følgende er ikke tillatt uten dokumentert behov:

- egen design system-plattform for et lite sett skjermer
- kompleks event-bus/global state-arkitektur før observert smerte
- custom data cache/normaliseringslag før konkrete ytelsesproblemer
- generisk formmotor for få enkle skjema
- overgeneriske hooks/components uten tydelig feature-forankring

## Kvalitetskriterier

- Kriterium 1: Featureflyt kan leses sekvensielt uten skjult logikk.
- Kriterium 2: Komponenttyper og hook-ansvar er tydelig skilt.
- Kriterium 3: State-strategi er eksplisitt og begrunnet.
- Kriterium 4: API-kontrakt og UI-tilstander er konsistente.
- Kriterium 5: Kritisk brukeradferd er testet på riktig nivå.

## Definisjon av ferdig

En frontend-endring er ferdig når:

- komponentarkitektur er eksplisitt (`route`/`container`/`presentational`)
- state-strategi er dokumentert og følger reglene
- loading/error/empty/ready er håndtert
- kritiske tester er grønne (isolert + featureflyt)
- kontrakt mot API er verifisert
- docs-impact er håndtert

## Operativ kontrakt for AI-agenter

Agenten skal alltid oppgi:

- hvilken feature/rute som endres
- hvilken komponentklassifisering som brukes (`route`/`container`/`presentational`)
- hvilken state-strategi som er valgt og hvorfor
- om custom hook er introdusert, og hvorfor det er tillatt
- hvordan API-feil (`error.code`) mappes til UI
- hvilke tester som verifiserer isolert logikk og featureflyt

Agenten skal stoppe og eskalere når:

- foreslått løsning krever ny global state-arkitektur uten tydelig behov
- kontrakt mellom API og UI er tvetydig
- komponentdesign bryter ansvarsdeling og krever stor omskriving
- rendering/state-regler ikke kan oppfylles uten å endre scope

## Endringslogg

- 2026-02-27: Opprettet
- 2026-02-27: Skjerpet med normativ komponentarkitektur, hooks-regler, state-policy, rendering-policy, anti-patterns og testbarhetskrav
- 2026-02-27: Supplert med derived-state-forbud, form-state-regler, race-condition-krav, memoization-disciplin, suspense/streaming-veiledning, performance invariants, debuggability og deterministisk rendering
