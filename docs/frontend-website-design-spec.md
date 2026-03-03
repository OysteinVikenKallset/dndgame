# Public Website Design Specification (Next.js) — v0.3

Last reviewed: 2026-03-02

Scope: `Frontend/website`.

## 1) Purpose

Define a minimal, modern neutral visual baseline for the public website that renders CMS-published pages.

Goals:

- improve readability and consistency
- keep implementation lightweight and token-driven
- preserve deterministic states for content and fallback views

Non-goals (MVP):

- full multi-brand theming
- advanced animation system
- expanded component library beyond current content needs

## 2) Design tokens and primitives

Tokenized variables are defined in `Frontend/website/src/app/globals.css` and include:

- surfaces/backgrounds (`--color-bg`, `--color-surface`, `--color-surface-2`)
- text scale (`--color-text`, `--color-text-muted`)
- borders (`--color-border`)
- semantic colors (`--color-primary`, `--color-info`, `--color-warning`, `--color-danger`)

Shared UI primitives:

- `components/ui/Container.tsx`
- `components/ui/Card.tsx`
- `components/ui/ButtonLink.tsx`
- `components/ui/Prose.tsx`
- `components/ui/AlertBlock.tsx`

Rules:

- Use tokens/primitives before adding one-off classes.
- Avoid hard-coded color values in components.
- Keep controls keyboard-focusable with visible focus styling.

## 3) Visual baseline (concrete)

This section defines concrete visual defaults for the public website so implementation remains consistent and demo-ready.

### 3.1 Color roles (MUST)

Neutrals:

- `bg`: `#FFFFFF`
- `surface`: `#FFFFFF`
- `surface-2`: `#F8FAFC`
- `border`: `#E2E8F0`
- `text`: `#0F172A`
- `text-muted`: `#475569`

Primary:

- `primary`: `#2563EB`
- `primary-hover`: `#1D4ED8`
- `focus`: `#60A5FA`

Semantic:

- `success`: `#16A34A`
- `warning`: `#D97706`
- `danger`: `#DC2626`
- `info`: `#0284C7`

MUST:

- `text` on `bg/surface` must remain WCAG-friendly for body text.
- `text-muted` must never be used for critical primary actions.

### 3.2 Typography contract (MUST)

- H1: `text-4xl md:text-5xl font-semibold tracking-tight text-slate-900`
- H2: `text-2xl md:text-3xl font-semibold tracking-tight text-slate-900`
- H3: `text-xl font-semibold tracking-tight text-slate-900`
- Body: `text-base leading-7 text-slate-700`
- Meta: `text-sm text-slate-500`

Prose baseline:

- `prose prose-slate max-w-none`
- Links in prose: `prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline`

### 3.3 Layout and spacing contract (MUST)

- Header/footer container: `max-w-6xl mx-auto px-4 sm:px-6`
- Content container: `max-w-6xl mx-auto px-4 sm:px-6`
- Base section spacing: `py-12 sm:py-16`
- Hero spacing: `pt-12 pb-8`
- Vertical rhythm between major sections: equivalent to `space-y-10` to `space-y-12`

SHOULD:

- Use `surface-2` sections to break up long white-space areas (especially CTA/next-step).

## 4) Information architecture and UI boundaries

Public website and CMS/debug concerns MUST be separated.

MUST:

- Public UI must prioritize customer-facing content (title, intro, body, clear CTA).
- Internal CMS/debug metadata (`slug`, `locale`, `id`) must not be primary hero content.
- If metadata is shown, it must be subtle and secondary (small text line, not headline block).

SHOULD:

- Prefer a single optional `Last updated` line over multiple technical metadata chips.

## 5) Navigation policy (MVP)

Navigation must be curated and deterministic.

MUST:

- Header navigation shows a maximum of 6 items.
- Navigation entries must be unique (dedupe by slug/title).
- Ordering must be deterministic (stable order every render).
- Navigation must follow CMS menu settings when available (`header.menu` / `footer.menu`).
- `All` in CMS menu means all published pages are candidates in that menu.
- `CMS Admin` action is a secondary action on the right side.

SHOULD:

- If a dedicated CMS menu model is not available, use a curated fixed set of top pages.
- For MVP, it is acceptable to use a hardcoded/featured menu list rather than raw auto-listing.

## 6) Page template contract (MVP)

Every public content page follows this composition:

1. Hero section (title + optional intro)
2. Main body (prose)
3. Optional related links section
4. Stable minimal footer

MUST:

- Content column max width is `max-w-6xl`.
- Header/footer container width is `max-w-6xl`.
- Hero-to-body and section spacing is consistent and repeatable.

Default template order (MUST):

1. Header (navigation)
2. Hero (H1 + optional lead)
3. Content body (prose)
4. Optional related links
5. Minimal footer

## 7) Page structure baseline

Root layout must include:

- skip-link (`Skip to content`)
- header with top-level navigation and CMS Admin action
- `main` region with stable spacing
- footer with published-pages links and copyright

Footer policy (MVP):

- Footer must be stable and low-noise.
- Link lists in footer must be curated and deduped.
- Public footer must not look like a raw content dump.
- Footer should prefer a minimal pattern when in doubt (`©`, optional contact/privacy links).

Content page baseline:

- metadata-driven title + description (from CMS title/body)
- hero/header block with customer-facing title + optional intro
- template policy: `post` MAY show discreet `createdAt` under title, `page` SHOULD hide date by default
- rendered CMS component blocks
- rendered rich-text body with prose styles
- related-pages section
- optional, discreet CMS Admin access in footer

Related/Published lists policy:

- Show a limited set only (max 8 links).
- Dedupe by slug/title before rendering.
- Show all published pages that pass dedupe/limit rules.

## 8) Component style baseline (MUST)

### 8.1 Buttons

Variants:

- `primary`: strong action color, used for main CTA
- `secondary`: subtle bordered/surface style
- `ghost`: low-emphasis action

All button variants MUST define:

- default
- hover
- active
- focus-visible
- disabled

### 8.2 Cards

Default card style MUST include:

- subtle border
- consistent radius
- light shadow
- consistent internal padding

### 8.3 Links

MUST:

- remain clearly identifiable as interactive
- have visible hover and focus behavior

Recommended base style:

- `text-primary hover:underline underline-offset-4`

## 9) Deterministic states

Required states for public rendering:

- `ready`: published page exists
- `empty`: body/components not present -> explicit empty message
- `not-found`: slug/locale unavailable
- `error`: runtime rendering failure (`app/error.tsx`)

## 10) Accessibility baseline

MUST:

- semantic landmarks (`header`, `main`, `footer`, `nav`)
- keyboard navigable controls and links
- visible focus indicators
- meaningful fallback copy for not-found/error

SHOULD:

- preserve readable line length in content layout
- use clear heading hierarchy in page templates

## 11) Do / Don’t (MVP)

DO:

- Show clear title and optional intro in hero.
- Keep content width constrained and spacing consistent.
- Keep footer minimal, curated, and stable.

DON’T:

- Don’t show `slug`/`locale`/`id` as hero-primary content.
- Don’t auto-render uncurated full page dumps in header/footer.
- Don’t place random CTA/cards between unrelated content blocks.

## 12) Demo-ready quality gates (acceptance)

MUST:

- Header nav shows no duplicates and has stable order.
- Hero avoids internal metadata as primary content.
- Body content remains inside configured max width with consistent prose styling.
- Footer appears curated and not debug-like.
- Visual sequence is clear: hero -> content -> next step -> footer.
- Color and typography match the defined visual baseline roles and scales.

## 13) Implementation notes (v0.3)

Implemented in this iteration:

- tokenized global styles and prose baseline
- shared primitives for layout/cards/links/alerts
- refactored page shell and related sections to shared primitives
- minimal Next.js error fallback page
- metadata generation for slug route
- v0.3 spec now includes concrete visual rules for palette/typography/layout/components
- CMS Admin URL is configurable via `CMS_ADMIN_URL` with local default fallback
