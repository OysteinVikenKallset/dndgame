# Skill: Frontend Accessibility & UX Baseline

## Metadata

- Owner: Engineering Team
- Stability: Evolving
- Last reviewed: 2026-02-28

## Related skills

- `ai-agent-doc-compliance.skill.md` (global AI governance)
- `frontend-architecture-and-code-quality-react-next.skill.md` (component/data/state architecture)
- `frontend-container-composition-and-props.skill.md` (container/props discipline)
- `clean-code.skill.md` (global quality rules)

## Mål

Sikre et minimumsnivå for universell utforming og grunnleggende UX-kvalitet i frontend,
slik at admin- og brukerflater er:

- tastaturvennlige
- forståelige ved feil og loading
- semantisk korrekt bygget
- konsistente nok for effektiv bruk

Denne skillen definerer baseline-regler, ikke et komplett designsystem.

## Når den brukes

- Ved nye eller endrede React/Next-views og komponenter
- Ved nye skjema (forms), modaler/dialoger og navigasjonsflyt
- Ved endringer i loading/error/empty-tilstander
- Ved review av AI-generert frontend-kode

## Kjerneprinsipper (må aldri brytes)

1. Tilgjengelighet er funksjonell kvalitet, ikke pynt
   - Hvis en kritisk flyt ikke kan gjennomføres med tastatur, regnes løsningen som ufullstendig.

2. Semantikk før workaround
   - Bruk semantiske HTML-elementer før ARIA-workarounds.

3. Feiltilstander skal være forståelige
   - Brukeren skal kunne forstå hva som gikk galt og hva som forventes videre.

4. Deterministisk brukeropplevelse
   - Loading/error/empty/ready skal være eksplisitt modellert.

## Definisjoner (for håndheving)

- Kritisk flyt: login, submit/save, publish, og handlinger som blokkerer videre arbeid.
- Blokkerende UU-feil: feil som hindrer tastaturnavigasjon, skjermleserbruk eller 200% zoom i kritisk flyt.

## Regler (MUST / SHOULD / MUST NOT)

MUST:

- Oppfylle WCAG 2.1 AA som minimum for sentrale brukerreiser.
- Sikre tastaturnavigasjon i kritiske flyter (login, submit, publish, save).
- Kritiske flyter må ikke ha blokkerende UU-feil for tastatur, skjermleser og 200% zoom.
- Ha tydelig fokusindikator på interaktive elementer.
- Gi alle skjemafelter synlig label og koblet feilmelding.
- Håndtere submit-feil med både feltspesifikk feil og tydelig global feilmelding ved behov.
- Bruke semantiske elementer (`button`, `a`, `label`, `form`, `nav`, `main`) der det er naturlig.
- Bruke `a` for navigasjon (URL/route) og `button` for handlinger.
- Alle interaktive elementer skal ha korrekt name/role/value (inkludert state som `aria-expanded`, `aria-selected`, `aria-checked` når relevant).
- Modellere `loading`, `error`, `empty`, `ready` eksplisitt i sentrale views.

SHOULD:

- Bruke `aria-live` for asynkrone status-/feilmeldinger.
- Flytte fokus til relevant heading/feilsammendrag etter kritiske tilstandsendringer.
- Holde kritiske admin-views brukbare ned til 360px bredde.
- Unngå fokusflytting ved vanlig innholdsoppdatering; flytt fokus kun ved kritiske overganger (ny route, dialog open/close, feilsammendrag).
- UI bør fungere ved 200% zoom uten horisontal scrolling i sentrale flyter.
- Kritiske interaksjoner bør ha tilstrekkelig target size (omtrent 44px).

MUST NOT:

- Bruke `div`/`span` som erstatning for knapper eller lenker i interaktiv kjerneflyt.
- Basere viktig informasjon kun på farge.
- Skjule valideringsfeil uten tydelig visuell og semantisk signalering.
- Introdusere utilgjengelige custom-komponenter uten dokumentert begrunnelse.

## Form patterns (baseline)

MUST:

- Hvert input-felt har label.
- Label knyttes eksplisitt med `htmlFor` + `id` (eller label-wrapper med korrekt semantikk).
- Hjelpetekst knyttes semantisk ved behov.
- Feilmeldinger knyttes til felter med korrekt tilgjengelighetsattributter.
- Felt med feil skal ha `aria-invalid="true"` og `aria-describedby` som inkluderer relevant error-id.
- Required-felter skal være tydelige både visuelt og semantisk (`required` eller `aria-required="true"`).
- Submit-knapp skal ha tydelig state (`idle`, `submitting`, `error`, `success` der relevant).

## Focus management

MUST:

- Modaler/dialoger skal ha fokusfelle ved åpning og returnere fokus ved lukking.
- Route-endring i sentrale flyter skal gi forutsigbart fokuspunkt (f.eks. sideoverskrift).

SHOULD:

- Ved åpning av dialog settes fokus på første meningsfulle element (f.eks. heading eller første input), ikke mekanisk på lukkeknapp.
- I App Router-flyter bør `main` + skip-link/fokusbar heading brukes konsekvent for pålitelig route-fokus.

## Loading / error / empty

MUST:

- Loading-state skal kommunisere at arbeid pågår.
- Error-state skal ha handlingsrettet tekst (prøv igjen / kontakt admin / sjekk input).
- Empty-state skal forklare hvorfor listen/siden er tom og hva brukeren kan gjøre.
- Page-level loading skal bruke `aria-busy="true"` på relevant hovedcontainer.

SHOULD:

- Inline async status (f.eks. lagring) bør annonsere via `aria-live="polite"`.
- `aria-live="assertive"` bør kun brukes ved kritiske feil som krever umiddelbar oppmerksomhet.

## Testing (minimum)

MUST:

- Test minst én tastaturbane i kritisk flyt per feature.
- Test minst én feilflyt i skjema med forventet tilgjengelig feilmelding.
- Test at sentrale views håndterer loading/error/empty/ready.

SHOULD:

- Inkludere en enkel tilgjengelighetskontroll i komponent/feature-tester (der verktøystack tillater det).

## Definition of Done (kritisk view)

Et kritisk view anses ferdig når:

- Hele kritisk flyt kan gjennomføres med tastatur alene.
- Interaktive elementer har korrekt name/role/value.
- Skjema har labels, required-semantikk og koblede feilmeldinger.
- Fokusflyt er stabil ved route-endring og dialog open/close.
- Loading/error/empty/ready er eksplisitt og testet.
- Minst én tastaturtest og én feilflyttest er grønn.

## Baseline patterns (kort)

Pattern A: Form-feilsammendrag

- Vis feilsammendrag øverst etter submit-feil.
- Flytt fokus til feilsammendrag (kritisk overgang).
- Behold feltspesifikke feil nær hvert felt.

Pattern B: Deterministiske view-tilstander

- Bruk guard-clauses i rekkefølge: `loading -> error -> empty -> ready`.
- Unngå dype ternary-uttrykk for sentrale tilstander.

Pattern C: Dialog-grunnmønster

- Semantisk dialogrolle med koblet overskrift.
- Fokusfelle under åpen dialog.
- Returner fokus til triggerelement ved lukking.

## Operativ arbeidsflyt

1. STEP 1: Identifiser kritisk brukerflyt og UU-risiko
2. STEP 2: Definer tilgjengelighetskrav for input, fokus og tilstander
3. STEP 3: Implementer minste løsning med semantiske elementer
4. STEP 4: Verifiser tastaturnavigasjon og feilmeldingsflyt
5. STEP 5: Kjør relevante tester og dokumenter eventuelle avvik

Hvis et steg hoppes over, regnes det som brudd på skill-regelverket.

## Hard stop-regel

Stopp og avklar hvis:

- design/krav krever interaksjon som bryter tastaturnavigasjon uten alternativ
- komponentbiblioteket mangler nødvendig UU-støtte for kritisk flyt
- det er konflikt mellom visuell designbeslutning og WCAG-baseline

## Anti-overengineering-regel

Ikke tillatt uten dokumentert behov:

- bygge full custom design system for å løse enkel MVP-UI
- avansert animasjons-/interaksjonsmotor som øker kompleksitet uten UU-gevinst
- nye abstraheringslag for forms/fokus uten observert smerte
