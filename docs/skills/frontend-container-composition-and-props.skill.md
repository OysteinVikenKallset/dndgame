# Skill: Frontend Container Composition & Props Discipline

## Metadata

- Owner: Engineering Team
- Stability: Stable
- Last reviewed: 2026-02-27

## Related skills

- `frontend-architecture-and-code-quality-react-next.skill.md` (base-regler for komponentansvar)
- `clean-code.skill.md` (lesbarhet, granulerte endringer)
- `clean-architecture.skill.md` (ansvarsdeling mellom lag)

## Mål

Redusere kognitiv belastning i store frontend-containere ved å standardisere:

- kontrollert props-overflate
- tydelig eierskap for selectors/dispatch/handlers
- samlet, navngitt derived state
- lesbar feature-entry for nye utviklere

## Terminology

- `viewModel`: Stabilt seksjons-API for rendering (verdier/copy/flags), uten `dispatch` og uten skjulte sideeffekter.
- `actions`: Navngitte callbacks for brukerinteraksjoner (`onSetX`, `onToggleY`), definert i container/controller og sendt til seksjonen.
- `viewModel/actions`-kontrakt: Standard props-form for store seksjoner for å unngå prop-eksplosjon og gjøre API-et lett å skanne.
- `controller` (`useXController`): Optional wiring-lag som samler selectors + dispatch-mapping; returnerer `viewModel` og `actions`.

## Når den brukes

- Ved refaktorering av store route/container-komponenter
- Når en komponent får høy props-mengde mot child-seksjoner
- Når selectors/dispatch/handlers gjentas i flere seksjoner
- Når output-regler og derived values er spredt i komponenten

## Kjerneprinsipper

- Props skal være et bevisst API, ikke en tilfeldig transportkanal (må aldri brytes)
- Container-flyt skal være lesbar sekvensielt uten hopping mellom mange abstraheringer (må aldri brytes)
- Derived state skal være samlet og navngitt før rendering (må aldri brytes)

## Kjerneprinsipper (må aldri brytes)

1. Props-budget per seksjon
   - Presentational components SHOULD ha <= 8 props.
   - Container/section components SHOULD ha <= 12 props.
   - Over terskel krever refaktor med ett eksplisitt tiltak.
   - Props-budget gjelder både antall props og bredde på `viewModel`.
   - `viewModel` MUST være et stabilt section-API, ikke en dump av hele feature-state.
   - Hvis `viewModel` har > ca. 15 felt eller > 2 nivåer nesting, SHOULD den splittes (f.eks. `viewModel` + `copy/options`, eller flere `viewModel`-objekter).
   - Event-handlers med samme domeneansvar skal grupperes, ikke spres tilfeldig.

   Tillatte tiltak ved over terskel (velg én):
   - Group props: send én `viewModel` i stedet for mange primitive props.
   - Section controller hook: flytt selectors/handlers til `useXController()`.
   - Feature-scoped context: bruk lokal context i feature, ikke global app-context.

   Feature Context-policy (gjelder når context velges):
   - Context MAY brukes for å redusere prop-drilling innen én feature.
   - Context MUST ha tydelig scope: provider skal ligge rundt feature root/route.
   - Context MUST NOT gjøres global uten ADR.
   - Context value MUST være stabil (memoized) når den inneholder objekter/funksjoner.
   - Context SHOULD kun inneholde `formState` (read-only), `actions` og eventuelt én samlet `uiState`-gruppe.
   - Context MUST NOT brukes som lager for derived state som kan beregnes lokalt i computed-blokk/section.

2. Én eier for state-tilgang
   - Redux-selectors for en featureflate skal samles i container eller dedikert feature-hook.
   - Dispatch-mapping skal samles i navngitte handler-funksjoner før JSX.
   - Child-komponenter skal ikke kjenne `dispatch` eller slice-internals direkte.

3. Samlet derived state-blokk
   - Alle sentrale beregnede outputs (variant, tekster, labels, synlighetslister) skal ligge i en eksplisitt, sammenhengende blokk før `return`.
   - Derived values skal navngis etter domenehensikt, ikke teknisk detalj.
   - Dobbeltberegning av samme verdi i ulike deler av komponenten er forbudt.

4. Lesbar feature-entry
   - En ny utvikler skal kunne forstå flyten ved å lese containeren top-down:
     - inputs/state
     - derived state
     - handlers
     - JSX-komposisjon
   - Hvis grunnforståelse krever hopping gjennom mange små filer, er abstraheringen for aggressiv.

5. ViewModel + Actions som seksjonskontrakt
   - Store seksjoner MUST eksponere props som `viewModel` + `actions` fremfor mange løse props.
   - `viewModel` skal inneholde alt seksjonen trenger for rendering.
   - `actions` skal inneholde alle handler-callbacks for seksjonen.

## Operativ arbeidsflyt

1. STEP 1: Kartlegg containerens state-input, derived state og sections
2. STEP 2: Mål props-overflate per seksjon og identifiser over-budsjett
3. STEP 3: Samle selectors og dispatch-mapping i én sammenhengende blokk
4. STEP 4: Samle og navngi derived outputs i én blokk
5. STEP 5: Reduser props-overflate med minste sikre endring
6. STEP 6: Verifiser at observerbar atferd er uendret

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hard Stop-regel

Stopp og avklar hvis:

- foreslått refaktor krever ny global state uten dokumentert behov
- props-reduksjon medfører skjult atferdsendring
- løsningen introduserer kontekst/provider kun for å unngå 1-2 nivåers prop-passing
- context foreslås på tvers av features uten ADR

## Kompleksitetsindikatorer

Refaktorering er påkrevd når en eller flere indikatorer oppstår:

- containerfil > ca. 250 linjer og fortsatt økende
- seksjonskomponent > 12 props
- mer enn 6 separate `useAppSelector` i route-entry uten tydelig gruppering
- mer enn 8 inline handler-funksjoner i JSX
- mer enn 3 anonyme inline callbacks i JSX i én container
- samme domeneverdi beregnes flere steder
- inline `dispatch(...)` i JSX gjentas i flere seksjoner

## Kognitiv belastning

Løsningen skal gjøre at en utvikler kan:

- forstå feature-flyt uten å lese mer enn 3-5 filer
- finne alle input->output-regler i navngitte util-/derived-blokker
- se hvilke handlers som påvirker hvilke seksjoner uten mental backtracking

## Hva "bekreftelse" betyr

- Gyldig: props-overflate er redusert eller tydelig begrunnet, og flyten er fortsatt deterministisk.
- Gyldig: lint/typecheck passerer og funksjonell atferd er bevart.
- Ugyldig: kun fil-splitting uten redusert kognitiv kompleksitet.

## Regler (må/skal)

- Må: Definer eksplisitt props-API for hver seksjon.
- Må: Samle selectors/dispatch i navngitte blokker før JSX.
- Må: Samle sentral derived state før JSX.
- Må: Hold child-seksjoner fri for infrastrukturdetaljer.
- Må: Ikke bruk `dispatch(...)` inline i JSX; dispatch-wiring skal ligge i `actions`/controller.
- Må: Hold form state og UI-only state atskilt (UI-state lokalt, ikke i global state).
- Skal: Begrens anonyme inline callbacks i JSX; over 3 callbacks i container bør flyttes til `actions`.
- Skal: Bruk handler-navn som uttrykker intensjon (`onSetMovingDuration`, ikke generisk `onChange`).
- Skal: Foretrekk ett viewModel-objekt per seksjon når props ellers blir brede.
- Skal: Samle selectors i én struktur (`formState`/`featureState`) før computed-blokk.

## Forbudte handlinger

- Prop drilling av `dispatch` og rå slice-actions gjennom flere lag.
- "Props explosion" uten eksplisitt begrunnelse i review.
- Duplisering av selectors/derived logikk på tvers av seksjoner.
- Introdusere context/provider kun for å skjule svak komponentgrense.
- Legge `dispatch(...)` direkte i JSX-attributter.
- Bruke `viewModel` som en ukontrollert state-dump.

## Anti-overengineering-regel

Følgende er ikke tillatt uten dokumentert behov:

- ny global state for lokal UI-koordinering
- nye generiske form-/section-rammeverk for én feature
- nye abstraksjonslag som øker antall filer uten å redusere kognitiv last
- feature-context som ny global standard uten dokumentert smerte i dagens props-flyt

## Abstraksjonstest (før ny hook/viewModel)

Før ny hook eller viewModel introduseres, sjekk:

- Fjerner den konkret props- eller handler-kompleksitet?
- Blir flyten enklere å lese top-down i containeren?
- Gjenbrukes den i minst to seksjoner, eller gir tydelig lesbarhetsgevinst i én stor seksjon?
- Er form state / UI state separert tydeligere etter abstraheringen?

Hvis nei, behold enklere lokal løsning.

## Kvalitetskriterier

- Kriterium 1: Props-overflate per seksjon er innenfor budsjett eller dokumentert.
- Kriterium 2: Selector/dispatch-eierskap er entydig.
- Kriterium 3: Derived outputs er samlet og navngitt.
- Kriterium 4: Containeren kan leses sekvensielt uten hopping.
- Kriterium 5: Ingen observerbar atferdsendring ved refaktor.
- Kriterium 6: Ingen inline dispatch i JSX.

## Controller Hook-pattern

- Hvis en seksjon krever > 8 props eller > 3 handlers, skal wiring flyttes til `useXController()`.
- `useXController()` skal ligge i samme feature-mappe som seksjonen den styrer.
- Hooken MAY bruke selectors og dispatch.
- Hooken MUST NOT gjøre API-kall eller datahenting.
- Hooken MUST returnere serialiserbare verdier + callbacks (ikke JSX, ikke store "manager"-objekter).
- Controller-hook skal returnere:
  - `viewModel`
  - `actions`

Eksempel:

- `<GettingStartedEmigrationSection viewModel={emigrationViewModel} actions={emigrationActions} />`

## Refactor safety checklist (obligatorisk ved props/container-refaktor)

- Må: Behold samme DOM/UX for happy path.
- Må: Behold samme feilhåndtering for minst én relevant feilcase.
- Må: Verifiser at form submit fortsatt bruker samme payload-kontrakt.
- Skal: Verifiser med eksisterende user-flow test/snapshot/kontraktasserts der det finnes.

## Tillatt vs ikke tillatt forbedring

Tillatt:

- samle selectors/handlers
- introdusere smale seksjonskomponenter
- innføre eksplisitt viewModel for props

Ikke tillatt:

- skjulte feature-endringer under "struktur"
- API-kontraktendringer uten krav
- nye globale avhengigheter for å løse lokal kompleksitet

## Definisjon av ferdig

Skillen er fulgt riktig når:

- containerens dataflyt er lesbar top-down
- seksjonsprops er kontrollert
- selectors/dispatch/derived state er konsolidert
- refaktor er verifisert uten atferdsendring

## Endringslogg

- 2026-02-27: Opprettet
- 2026-02-27: Skjerpet med props-budget (8/12), viewModel/actions-kontrakt, inline-dispatch-forbud og feature-context-policy
- 2026-02-27: Presisert viewModel-bredde, inline-callback-grense, controller-hook-rammer og obligatorisk refactor safety checklist
