# CMS Admin Design Specification — Modern Neutral v0.2

Last reviewed: 2026-03-02
Style direction: Light, neutral, crisp, low-noise, high-clarity
Target: "Ser designet ut" + konsistent UI for demo til kunde

## 0) Design goals

MUST:

- Tydelig informasjons-hierarki.
- Konsistent spacing, typografi og komponent-states.
- Rolig og presis UI med lite visuell støy.
- UU-baseline: synlig fokus-ring og praktisk WCAG AA-kontrast.

SHOULD:

- Minimal fargebruk: primært actions og status.
- Samme actions-mønster på alle sider: primær handling øverst til høyre.

## 1) Foundations (tokens)

Design styres av roller (`bg`, `surface`, `border`, `text`, `primary`, semantiske roller), ikke tilfeldige hex-koder per komponent.

### 1.1 Color roles

- Neutrals: `bg`, `surface`, `surface-2`, `border`, `text`, `text-muted`, `text-disabled`
- Brand/action: `primary`, `primary-hover`, `primary-active`, `focus`
- Semantic: `success`, `warning`, `danger`, `info` + tilsvarende `*-bg`
- Interactive neutrals: `hover`, `active`, `disabled-bg`

### 1.2 Default palette

- `primary: #2563EB`
- `primary-hover: #1D4ED8`
- `primary-active: #1E40AF`
- `focus: #60A5FA`
- `bg: #F8FAFC`
- `surface: #FFFFFF`
- `surface-2: #F1F5F9`
- `border: #E2E8F0`
- `text: #0F172A`
- `text-muted: #475569`
- `text-disabled: #94A3B8`
- `success: #16A34A`, `success-bg: #DCFCE7`
- `warning: #D97706`, `warning-bg: #FFEDD5`
- `danger: #DC2626`, `danger-bg: #FEE2E2`
- `info: #0284C7`, `info-bg: #E0F2FE`

### 1.3 Typography

- Font: system stack (`ui-sans-serif`, `system-ui`, ...)
- Scale: `12/14/16/18/22/28`
- Weight: `400/500/600`
- Line-height: `1.4-1.6` for brødtekst, `1.2-1.3` for headings

### 1.4 Spacing, radius, shadow

- Spacing scale: `4, 8, 12, 16, 24, 32, 40, 48`
- Page padding: `24px` desktop / `16px` mobile
- Editor max width: `760px`
- Radius: `8px` (sm), `12px` (md)
- Shadows: `shadow-1` for card, `shadow-2` for modal/popover

### 1.5 CSS variables source of truth

Implementasjon ligger i `Frontend/admin/src/styles.css` (`:root` tokens).

## 2) UI kit minimum

Obligatoriske grunnkomponenter:

- `Button`: `primary`, `secondary`, `ghost`, `danger` + `hover/active/focus-visible/disabled/loading`
- `Input` / `Textarea`: standard border/focus/error
- `FormField`: label + hint + error layout
- `Badge`: konsistent statusvisning (DRAFT/PUBLISHED/ARCHIVED)
- `Card`: standard panel/surface
- `ConfirmModal`: archive/confirm med fokusfelle og fokus-retur

## 3) Screen patterns

- Felles page header: venstre `H1` (+ evt. metadata), høyre actions for sider som bruker header-actions.
- Pages list: filter-bar + primary CTA, table i card, tom-state med CTA.
- Editor: card, max bredde `760px`, formfelt til venstre og vertikal actions-kolonne til høyre (`Publish`, `Unpublish`, `Archive`).
- Editor: `Save` er primær handling nederst i selve edit-formen.
- Login: sentrert card med tydelig tittel og primary submit.

## 4) Interaction rules

MUST:

- `:focus-visible` ring på alle interaktive elementer.
- Hover/active på knapper og table-rows.
- Disabled-state visuelt tydelig (`cursor: not-allowed`, lavere kontrast).

SHOULD:

- Subtile overganger (`150ms`) for `background`, `border`, `shadow`.

## 5) Microcopy

- Verb først i knapper: `Create page`, `Save`, `Publish`, `Archive`.
- Konkrete feiltekster: f.eks. `Title is required`.
- Sentence case som standard i UI.

## 6) Design QA checklist (demo-ready)

- Konsistent header og actions-plassering på alle views
- Table hover + actions align
- Inputs med labels og jevn error-layout
- Konsistente status badges
- Synlig fokus-ring med tastatur
- Jevn spacing uten tilfeldige avvik
- Ferdige loading/error/empty states

## 7) MVP implementeringsrekkefølge

1. Tokens + base typography
2. UI kit minimumskomponenter
3. Restyle `Login`, `Pages`, `Editor`
4. Toast + confirm modal
5. Hover/focus/disabled + empty/error polish
