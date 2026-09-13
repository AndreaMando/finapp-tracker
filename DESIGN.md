---
name: Vaulty
description: A personal finance tracker that reads each month like a page of a printed financial ledger.
colors:
  bg-light: "#f7f5f1"
  surface-light: "#fffefc"
  surface-sunken-light: "#f0ecE4"
  ink-light: "#17140f"
  ink-muted-light: "#6b6558"
  ink-faint-light: "#948d7c"
  hairline-light: "#e1dcd1"
  accent-light: "#1f6f52"
  accent-contrast-light: "#fffefc"
  negative-light: "#b3402b"
  goal-light: "#5c5296"
  bg-dark: "#15130f"
  surface-dark: "#1c1a15"
  surface-sunken-dark: "#100f0c"
  ink-dark: "#f2efe7"
  ink-muted-dark: "#a69c89"
  ink-faint-dark: "#6f6858"
  hairline-dark: "#322d24"
  accent-dark: "#3fae82"
  accent-contrast-dark: "#0e1310"
  negative-dark: "#d9694c"
  goal-dark: "#8f86d9"
typography:
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "normal"
  label:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.1em"
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    fontFeature: "tabular-nums"
  display:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(3rem, 6vw, 3.75rem)"
    fontWeight: 700
    fontFeature: "tabular-nums"
rounded:
  sm: "6px"
  md: "8px"
  lg: "9999px"
spacing:
  sm: "0.75rem"
  md: "1.5rem"
  lg: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent-contrast-light}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-sunken-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-destructive:
    backgroundColor: "{colors.negative-light}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface-sunken-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Vaulty

## Overview

**Creative North Star: "Newsprint Financial Page"**

Vaulty reads each month like one page of the user's own printed financial ledger or bank statement, not a row of side-by-side app-menu cards. The ground is a warm-cool drifting off-white in light mode and a warm near-black in dark mode — deliberately never flat white or pure black, so the surface always reads as paper or stock rather than a screen default. One restrained deep-emerald accent carries positive figures and all primary actions; a muted brick-red carries negative figures and destructive actions; a violet is reserved for goal-related figures. Hairline rules divide every section the way a printed statement divides its line items. Rendering is flat throughout: no gradients, no drop shadows for elevation (only a light `shadow-lg` on floating overlays), no neon glow — a direct rejection of the prior dark-only, neon-adjacent look the product brief explicitly ruled out.

Public Sans carries all UI, body, and display text — one quiet grotesk for everything. JetBrains Mono is reserved specifically for currency figures and date/category micro-labels, echoing a ledger column's monospace alignment; it is a data typeface here, not a display costume, and every mono figure carries tabular numerals (`font-variant-numeric: tabular-nums`) so amounts align vertically as they change.

The system is functionality-frozen redesign of an existing tracker (see PRODUCT.md): every visual decision maps to an existing capability. Three signature interactions carry the ledger metaphor into motion — a draggable month-scrub control, a slide-to-apply confirm gesture for the monthly recurring-expense ritual, and count-up animated figures wherever a monetary value first renders.

**Key Characteristics:**
- Warm off-white / warm near-black grounds, never pure white or pure black.
- One accent (emerald) for positive/primary, one for negative (brick-red), one for goals (violet) — no other saturated color enters the UI except the eight user-chosen savings-goal swatches.
- Hairline dividers instead of card shadows to separate sections.
- Public Sans for everything textual; JetBrains Mono strictly for figures and micro-labels, always tabular.
- Flat, no-gradient rendering; the only "elevation" is a modal/dialog drop shadow.

## Colors

The palette is a light/dark pair of near-neutral grounds plus three semantic accents; there is no purely decorative color beyond the eight user-selectable savings-goal swatches.

### Primary
- **Ledger Emerald** (`#1f6f52` light / `#3fae82` dark — `--accent`): positive figures, primary buttons, active nav state, focus rings, selection color, progress fills, links.

### Secondary
- **Ledger Brick** (`#b3402b` light / `#d9694c` dark — `--negative`): negative figures (net savings when negative, one-time-expense donut wedge), destructive buttons, delete affordances, error banners/text.
- **Ledger Violet** (`#5c5296` light / `#8f86d9` dark — `--goal`): goal-contribution figures and the donut's goal-contribution wedge only. Never used for buttons or nav.

### Neutral
- **Page** (`#f7f5f1` light / `#15130f` dark — `--bg`): the app's outermost ground.
- **Surface** (`#fffefc` light / `#1c1a15` dark — `--surface`): cards, header/nav bars, modals.
- **Surface Sunken** (`#f0ecE4` light / `#100f0c` dark — `--surface-sunken`): recessed fields, inputs, skeleton blocks, table-of-values backgrounds — one step "into the page" from Surface.
- **Ink** (`#17140f` light / `#f2efe7` dark — `--ink`): primary text.
- **Ink Muted** (`#6b6558` light / `#a69c89` dark — `--ink-muted`): secondary text, labels, captions.
- **Ink Faint** (`#948d7c` light / `#6f6858` dark — `--ink-faint`): tertiary text, micro-label uppercase tags, disabled/placeholder-adjacent content, scrollbar thumb.
- **Hairline** (`#e1dcd1` light / `#322d24` dark — `--hairline`): the single border/divider color used everywhere a rule is needed.

### Named Rules
**The Hairline-Not-Shadow Rule.** Sections and list rows are separated by a 1px hairline (`--hairline`), never a card shadow. The only shadow in the system (`shadow-lg`) is reserved for floating overlays (Modal, ConfirmDialog, settings dropdown) that must visually detach from the page.

**The One Warm Ground Rule.** `--bg`, `--surface`, and `--surface-sunken` are always warm-tinted, never pure white/black/gray. This is a direct, evidenced rejection of a neon-on-pure-black look.

**The Mono-Is-Data Rule.** `font-mono` (JetBrains Mono) is applied only to currency figures, dates, month keys, and short uppercase micro-labels — never to headings, body copy, or paragraph text. If it isn't a ledger figure or column label, it isn't mono.

## Typography

**Display Font:** Public Sans (with ui-sans-serif, system-ui fallback)
**Body Font:** Public Sans (same family — one typeface for all UI/body text)
**Label/Mono Font:** JetBrains Mono (with ui-monospace fallback) — figures and micro-labels only

**Character:** A single civic/financial-document grotesk (Public Sans) carries voice and hierarchy through weight and size alone; JetBrains Mono appears only where a ledger would actually use a monospaced column — currency amounts, dates, and uppercase micro-labels — so its presence always signals "this is a measured value," never decoration.

### Hierarchy
- **Display** (700, `text-5xl`/`text-6xl` i.e. 3rem–3.75rem, tight leading, font-mono, tabular-nums): the dashboard's Net Savings figure — the largest figure on the page, can render in accent (positive) or negative color.
- **Headline** (700, `text-2xl`/1.5rem, tracking-tight, Public Sans): page titles ("Dashboard", "Income", "Savings Goals").
- **Title** (600, `text-sm`/0.875rem, Public Sans): card/section titles, modal titles, list-row primary text.
- **Body** (400, `text-sm`/0.875rem, Public Sans): descriptions, form labels' adjacent copy, ledger row secondary text.
- **Label** (600, tracking-widest, uppercase, font-mono, `--ink-faint`): section micro-headings (`SectionHeading`), form field labels, dropdown group labels, badge/pill text — the recurring "ledger column header" treatment. Three documented steps, all legitimate (not drift): `text-[9px]` (mobile bottom-nav labels only, where vertical space is tightest), `text-[10px]` (dropdown/skeleton micro-captions), `text-[11px]` (the default label size — form field labels, `SealedBadge`, category badges; this is the step most of the system actually uses).
- **Figure** (600–700, `text-sm`–`text-lg`, font-mono, tabular-nums): every monetary amount and percentage anywhere in the product.

### Documented Exception
The login carousel's italic motto ("Because our goal is to make your goals easier.") uses a one-off fluid size, `clamp(1.3rem, 2vw, 2rem)`, instead of a fixed ramp step — it's a single decorative pull-quote on one unauthenticated screen, sized to the carousel column rather than to body content, and isn't a pattern any other text in the system should reuse.

### Named Rules
**The Tabular-Nums-Everywhere Rule.** Any element carrying `font-mono` also carries `tabular-nums` (enforced globally in `globals.css` for `.font-mono`/`.tabular-nums`), so digits never shift width as counted-up figures animate or as list values update.

## Layout

The authenticated shell uses the full viewport width — no centered, max-width-constrained page shell, per the product's explicit complaint that the prior UI wasted large screens. Individual pages instead cap their own content at a generous max-width (`max-w-[1680px]` on the dashboard, `max-w-[1600px]` on income) while still spanning the full available width on anything narrower. Padding scales responsively: `p-6` at rest, `lg:p-8`/`lg:p-10` on large viewports.

The dashboard's flagship layout is a single bordered, hairline-divided panel (`divide-y divide-hairline`) whose sections (header/month-scrub, overview, recurring-apply, goals) stack top to bottom like consecutive pages of a statement, rather than being distributed into separate floating cards. Other pages (Income, Goals) use a grid of bordered `Surface` cards with generous internal padding (`p-5`/`p-6`) and `gap-4`–`gap-6` between them, collapsing to a single column below `lg`/`md`.

Navigation is two physically distinct layouts, not one fluid one: a top `<header>` bar (logo + inline nav + settings dropdown) on `md`+ screens, and a fixed bottom tab bar (icon + 10px label, safe-area-inset-padded) on mobile — the product's own operating-context requirement that mobile and desktop each get a layout that actually works for them.

## Elevation & Depth

The system is flat by default: cards, buttons, and inputs carry a 1px hairline border and no box-shadow. Depth is conveyed by tonal layering (`--bg` → `--surface` → `--surface-sunken`, each a discrete step warmer/darker or lighter) rather than by shadow. The one exception is floating overlays — `Modal`, `ConfirmDialog`, and the Sidebar's settings dropdown — which use `shadow-lg` to signal they sit outside the page's document flow.

### Shadow Vocabulary
- **Overlay** (`shadow-lg`, Tailwind default): Modal, ConfirmDialog, settings dropdown only. Never used on in-page cards.

### Named Rules
**The Flat-By-Default Rule.** Surfaces at rest never carry a shadow. A shadow appears only when an element floats above the document (modal, dialog, dropdown), never as generic card styling.

## Shapes

Corners are consistently rounded but restrained: `rounded-md`/`rounded-lg` (≈8px) on cards, buttons, inputs, and panels; fully circular (`rounded-full`, 999px) on badges, avatar-style icon tiles, progress-bar tracks/fills, the month-scrub label well, and the slide-to-apply track/handle. The Logo's outer plate uses a squircle radius (`rx="9"` on a 40×40 viewBox) that the same icon-tile rounding language echoes elsewhere. Borders are uniformly 1px hairline; there is no double-border or heavy-stroke treatment anywhere in the system.

## Components

### Buttons
- **Shape:** `rounded-md`/`rounded-lg` (8px), never fully square or fully pill except the slide-to-apply handle.
- **Primary:** `bg-accent` / `text-accent-contrast`, `py-2.5`–`py-3` `px-4`, semibold, `hover:opacity-90`, `active:scale-[0.98]`.
- **Secondary / Ghost:** `bg-surface-sunken` text-ink, `hover:bg-hairline`; or transparent with `text-ink-muted hover:text-ink hover:bg-surface-sunken` for icon-only nav/utility buttons.
- **Destructive:** `bg-negative/10 text-negative`, `hover:bg-negative/20` — tinted, not solid-fill, so destructive actions read as a warning tint rather than a loud solid red block.
- **Focus:** every interactive element carries `focus-visible:ring-2 ring-accent` (or `ring-negative` for destructive controls), offset from its own background.

### Cards / Containers
- **Corner Style:** `rounded-lg` (8-9px).
- **Background:** `bg-surface` with `border border-hairline`; nested recessed elements (stat tiles, previews) use `bg-surface-sunken`.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Internal Padding:** `p-5`/`p-6` standard card padding; `px-6 py-4` for list rows.

### Inputs / Fields
- **Style:** `bg-surface-sunken`, `border border-hairline`, `rounded-lg`/`rounded-md`, `px-4 py-3`.
- **Focus:** `focus:ring-1 focus:ring-accent focus:border-accent` — a thin ring plus border-color shift, no glow/blur.
- **Error:** red inline text (`text-negative`) below the field plus `aria-invalid`; no red border treatment on the field itself.

### Navigation
- **Desktop:** full-width `<header>` on `bg-surface` with a bottom hairline; inline text+icon links, active state is a solid `bg-accent`/`text-accent-contrast` pill, inactive is `text-ink-muted` with a `hover:bg-surface-sunken` tint.
- **Mobile:** fixed bottom tab bar, same surface/hairline treatment, icon-over-10px-label stack, active state colors the icon+label `text-accent` (no background pill, unlike desktop).
- **Settings dropdown:** `bg-surface` panel with hairline border and `shadow-lg`, houses theme toggle (segmented light/dark control), language `<select>`, and logout — all sharing the label micro-heading treatment.

### Modal / Dialog
Both `Modal` (routed forms — Set Income, New Goal, Add Contribution) and `ConfirmDialog` (destructive confirmations) are true modal overlays: a `bg-ink/40` scrim, a `bg-surface` panel with hairline border, `rounded-lg`, `shadow-lg`, focus trap, and Escape-to-close. **Binding decision, not a gap:** inline in-place editing was explored as a raise during this build's direction contract and was explicitly declined by the user, who pinned modals as the interaction pattern for adding/editing records (restyle only). Do not reintroduce inline editing on these flows in future work — it is a deliberately rejected pattern here, not an unfinished one.

### SealedBadge (signature component)
A rotated ink-stamp motif — a double-ringed circular disc (`-rotate-[10deg]`) with a checkmark, paired with an uppercase mono label (`-rotate-[2deg]`) — marking "done and locked in" states: completed savings goals and applied recurring expenses. Built entirely from existing accent tokens (no new color), and reserved for these two completion states only; it is not a generic "verified" chip for arbitrary future use.

### Month Scrub (signature component)
A bordered, hairline-divided control combining always-visible prev/next chevron buttons with a central draggable/swipeable label well (Pointer Events, resistance-dampened visual offset, snap-to-nearest-month on release, Arrow-key fallback when focused). The drag is strictly additive to the chevrons, never their replacement.

### Slide-to-Apply (signature component)
A pill-shaped track (`rounded-full`, `bg-surface-sunken`) with a circular accent handle that the user drags to the end to confirm the monthly recurring-expenses-apply action. The fill behind the handle animates via `transform: scaleX()` from a `transform-origin: left` layer, not the `width` property, so the "gathering" feedback is compositor-only and never reflows the track on every frame. The handle is a real `<button>`: a plain click or Enter/Space fires the same confirm handler as a completed drag, so the gesture is always additive to a standard control, never gesture-exclusive.

### Count-Up Figures (signature component)
Every monetary or percentage figure that renders for the first time (or updates on month change) animates from 0 (or its prior value) to its target via `useCountUp`, respecting `prefers-reduced-motion` (renders the final value immediately, no animation). Applies to the donut's `ValueRow` amounts, the Net Savings figure, and other first-paint monetary values.

### Donut / Bar Charts (signature component)
Hand-rolled inline SVG, no charting library. The dashboard donut is a stroke-based ring built from `stroke-dasharray`/`stroke-dashoffset` arcs, flat-colored, decorative (`aria-hidden`, values duplicated as accessible text in the adjacent value list). The Income and Expenses yearly bar charts follow the same hand-rolled-SVG, flat-fill, current-month-highlighted pattern, with the current month's bar in full accent/negative tone and other months in a 25%-opacity tint of the same color.

### Goal Illustration (signature component)
An authored, deterministic abstract "postcard" illustration (flat-color horizon/hill/sun scene) built from a goal's own color plus `color-mix()`-derived tints/shades, seeded from the goal's id via a small PRNG so the same goal always redraws identically while different goals visibly differ. Decorative only (`aria-hidden`); no text is ever placed on the illustrated band — all readable figures live on the card's neutral `Surface` body below it.

## Do's and Don'ts

### Do:
- **Do** keep every monetary figure in JetBrains Mono with tabular numerals, regardless of which page it appears on.
- **Do** use hairline dividers (`border-hairline`, `divide-hairline`) to separate sections and list rows instead of card shadows or extra background changes.
- **Do** reserve `shadow-lg` for floating overlays only (Modal, ConfirmDialog, dropdown menus).
- **Do** make every signature gesture (month-scrub drag, slide-to-apply) additive to a plain click/keyboard path — never the only way to complete the action.
- **Do** keep destructive actions in the tinted `bg-negative/10 text-negative` treatment, not a solid red fill.

### Don't:
- **Don't** introduce a gradient or a drop-shadow-as-elevation anywhere; the system is flat by design (a direct rejection of the prior neon/dark-only look the product brief ruled out).
- **Don't** use pure white, pure black, or a cool/neutral gray for `bg`/`surface`/`surface-sunken` — the warm drift is load-bearing to the "printed page" identity.
- **Don't** apply JetBrains Mono to headings, paragraphs, or navigation labels — it is reserved for figures, dates, and uppercase micro-labels only.
- **Don't** rebuild the Modal/ConfirmDialog forms as inline in-place editing. This was explicitly proposed and explicitly declined by the user during this build (restyle-only, keep as modals) — treat it as a binding decision, not an unresolved gap.
- **Don't** treat the SealedBadge ink-stamp or the Goal Illustration postcard band as general-purpose decorative devices for future surfaces; both are reserved for the specific states/surface documented above (completion states; Savings Goals cards respectively).
