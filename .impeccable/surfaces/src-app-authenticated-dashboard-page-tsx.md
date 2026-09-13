---
version: 1
slug: "src-app-authenticated-dashboard-page-tsx"
primary_target: "src/app/(authenticated)/dashboard/page.tsx"
related_targets: ["src/app/(authenticated)/income/page.tsx","src/app/(authenticated)/expenses/page.tsx","src/app/(authenticated)/recurring/page.tsx","src/app/(authenticated)/goals/page.tsx","src/app/page.tsx","src/app/register/page.tsx","src/app/(authenticated)/components/layout/Sidebar.tsx","src/components/ui/Modal.tsx"]
---

## Scope
Full visual redesign of Vaulty (functionality frozen, see PRODUCT.md). Primary surface: dashboard. Related surfaces share this same world: income, expenses (merged with recurring expenses), savings goals, login, register, shared navbar/bottombar, shared modals, logo.

## Direction contract

THESIS: The month reads as one page of the user's own financial ledger/statement, not a row of side-by-side app menus — a printed financial-report register, not a generic SaaS dashboard.

OWN-WORLD: Warm-cool drifting off-white ground in light mode / warm near-black in dark mode — never flat white or pure black. One restrained deep-emerald accent for positive figures, a muted brick-red for negative figures. Hairline rules divide every section. Public Sans carries all UI, body, and display text. JetBrains Mono is reserved only for currency figures and date/category micro-labels, echoing a ledger column's monospace alignment (data/measurement, not costume). Tabular numerals throughout.

STORY: A user opens Vaulty and reads their month like a bank statement page in one glance: income, one-time expenses, recurring expenses still pending, goal contributions, and net savings — every section present even when its value is zero.

FIRST VIEWPORT (dashboard): full page width, no centered/constrained shell. A persistent month-scrub control replaces the two tiny prev/next arrows. A centered donut chart (income / one-time expenses / recurring-still-to-apply / goal contributions) with a hairline-divided value list on both sides (label, %, amount — always shown, even at 0%/€0). Net savings sits directly below in the largest type on the page, and can read negative. The recurring-apply section and open savings goals sit beneath.

FORM: "Newsprint Financial Page" — assigned candidate (4 of 7 grounded directions: Cash Envelope, Passbook Ledger, ATM Receipt, Newsprint Financial Page, Trading Ticker, Vault Door, Bank Card), raised by four donations: inline in-place editing instead of routing every edit through a modal (from a HyperCard-stack challenger); a drifting warm/cool off-white ground plus a rotating verified/applied-stamp motif (from a design-annual plate-section challenger); illustrated flat-color "postcard" plane cards reserved specifically for Savings Goals (from a WPA park-poster challenger); a pull-to-gather signature gesture for confirming the monthly recurring-expenses-apply ritual (from a transforming-drawcord-cape challenger). Concept-seed key: d4b98b6a (direction scope, operate mode).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions
- Exact hex values for the emerald/brick-red accent pair and the light/dark off-white/near-black ground pair (to be fixed as CSS tokens during build).
- Whether the merged Expenses+Recurring page uses tabs, an in-page anchor split, or a true two-section scroll (user asked for "two divided sections, Expenses shown first").
- Logo: recolor existing lock+coin+piggy-bank mark to the new palette vs. redraw entirely — left to build-time judgment, must keep the vault/savings meaning.

## Fix-round correction (post finish-review)

The finish reviewer flagged the FORM section's "inline in-place editing instead of modal-only" raise (donated from a HyperCard-stack challenger) as unbuilt. It is being dropped deliberately, not fixed: the user explicitly pinned modals as the interaction pattern for adding/editing records ("I menù modal dovranno essere aggiornati al nuovo design, ma funzionalmente vanno bene" — restyle only, keep as modals). Per this skill's own rule, a user-/brief-pinned decision beats a donated raise. Modals stay; only their visual restyle (already shipped) applies. Do not build inline editing in the fix round below.

Remaining material fixes from the finish review ARE being built in this round: real drag/swipe month-scrub, a pull-to-gather/slide-to-confirm gesture for the recurring-apply action, a rotating ink-stamp SealedBadge, an authored (not solid-rectangle) illustration plane on Savings Goals cards, replacing the goals summary row's banned same-size hero-metric-card template with inline ledger figures, and regenerating the login/register carousel screenshots from the actual shipped redesign instead of the pre-redesign UI.
