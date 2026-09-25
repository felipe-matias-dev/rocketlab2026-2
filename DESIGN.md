<!-- SEED: established directly with the user (Operate-mode admin tool; lighter direct path chosen over the full new-work concept-tournament workshop, since this surface has no brand identity at stake) before implementation. Re-run `/impeccable document` in scan mode once the frontend has real code, to extract actual tokens/components. -->

---
name: RocketLab Movie Admin
description: Internal admin panel for managing a movie catalog and its reviews
colors:
  accent: "#f59e0b"
  accent-hover: "#d97706"
  neutral-bg: "#f5f2ec"
  neutral-surface: "#ffffff"
  neutral-surface-muted: "#eee9df"
  neutral-border: "#e3ddd0"
  neutral-text: "#1c1917"
  neutral-text-muted: "#78716c"
  destructive: "#dc2626"
  success: "#059669"
typography:
  body:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: "8px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
---

# Design System: RocketLab Movie Admin

## Overview

**Creative North Star: "The Screening Room Ledger"**

An internal tool, not a storefront: a single administrator scanning a large, real catalog
(~95k movies), opening a title to review its history, correcting or adding entries. The
personality is that of a well-kept ledger, not a marketing surface: neutral paper-white
surfaces, one warm accent reserved for action and for rating, and no decoration competing with
the data. Density is moderate: comfortable enough to scan a grid of movie cards for long
stretches, not so airy that pagination feels wasteful, not so tight that it reads as a cockpit.

Confirmed visual rejections: no purple/blue AI-gradient default, no glassmorphism, no dark-mode
requirement in the MVP, no third-party/CDN font loading, no 5-star iconography implying a 1-5
scale (the rating scale is numeric 0-10 - see PRODUCT.md). A 10-star widget mapped 1:1 to the
existing 0-10 scale (continuous fill, one star per point) is fine - it's a display convention for
the same numeric scale, not a different scale.

**Key Characteristics:**
- Warm stone surfaces (not cool zinc) with a single amber accent, used consistently everywhere
  (buttons, links, active states, rating emphasis) rather than scattered accent colors. The page
  background sits visibly warmer/deeper than card surfaces so elevated content actually reads as
  elevated, instead of white-on-white.
- Cards and panels carry a soft, tinted shadow (never pure black) rather than relying on a border
  alone - revised from the original all-flat "ledger" concept after the restraint read as bland
  in practice; see Elevation & Depth below.
- Inter Variable, self-hosted (no CDN call) - revised from the original system-font-only stack
  once the ledger read as generic; still a single workhorse family with the system stack kept as
  fallback, so the zero-CDN-dependency and instant-render intent survives the swap. See
  Typography below for the reasoning and trade-off.
- One corner-radius scale throughout, with pill shape reserved for badges/tags only.
- Motion exists but is restrained and purposeful (Emil Kowalski principles): short, eased
  transitions on interactive feedback, never decorative loops, never on high-frequency actions
  like pagination.

## Colors

Restrained strategy: one neutral family (warm Stone) carries the whole surface, one accent
(Amber) carries every actionable and rating-related emphasis, and two semantic colors (red,
emerald) are reserved strictly for destructive/success feedback, never used as decoration.

### Primary
- **Amber** (`#f59e0b`, hover `#d97706`): primary buttons, links, active nav state, star/rating
  emphasis, focus rings. Used identically across every screen (Color Consistency Lock).

### Neutral
- **Paper** (`#f5f2ec`): page background - warm ivory, deliberately deeper than Surface so cards
  visually sit on top of it.
- **Surface** (`#ffffff`): cards, modals, form panels.
- **Surface Muted** (`#eee9df`): poster/image placeholders, skeleton loading blocks.
- **Border** (`#e3ddd0`): dividers, input borders at rest.
- **Ink** (`#1c1917`): primary text.
- **Ink Muted** (`#78716c`): secondary text, helper text, metadata (year, review count).

### Named Rules
**The One Accent Rule.** Amber is the only brand accent on the page. Destructive (red) and
success (emerald) are semantic status colors, never substitutes for the brand accent and never
used decoratively.

## Typography

**Body Font:** `"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
Helvetica, Arial, sans-serif`

**Character:** Revised from the original system-stack-only decision: the system stack rendered
correctly but read as an unexamined default rather than a considered choice, undercutting the
"well-kept ledger" north star it was meant to serve. Inter Variable is a single, self-hosted
variable font (`@fontsource-variable/inter`, weight axis only - no italic subset, since none of
this UI uses italics) - it keeps the same intent (one workhorse family, no display/headline
typeface, hierarchy from weight and size, no CDN call, no runtime font-pairing decision) while
having a taller x-height, tighter numeral spacing, and better hinting at UI sizes than the
default system stack, which reads as more deliberate craft in a data-dense admin tool. The
system stack remains as the fallback chain, so a blocked/slow font fetch degrades gracefully
rather than to invisible text (`font-display: swap` is set by the package). Trade-off accepted
knowingly: this adds a small self-hosted asset (~20-30kB gzipped for the Latin/Latin-ext subsets
this app actually uses) where the previous stack shipped zero bytes - judged worth it for the
perceived-quality gain given the tool is used in-session on a warm cache, not on a cold mobile
connection. No display/headline font is introduced; hierarchy still comes from weight and size
within the one family, not a second typeface.

### Hierarchy
- **Title** (600, 1.5rem-1.875rem, 1.2 line-height): page titles, movie title on detail view.
- **Body** (400, 1rem, 1.5 line-height): catalog cards, form fields, review text.
- **Label** (500, 0.875rem, uppercase off): form labels, table/card metadata.
- **Numeric/data** (tabular figures via `tabular-nums`): ratings, release years, box-office and
  budget figures - anywhere digits repeat down a card grid or stat list, so columns of numbers
  align instead of jittering with each digit's natural width.

## Layout

Standard content width capped at `max-w-7xl`, centered. Catalog renders as a responsive CSS
grid (never flex-percentage math), collapsing to a single column below `md`. Spacing scale is
Tailwind's default (`spacing.sm/md/lg` above map to `2/4/6`); section padding stays moderate
(`py-8`-`py-12`), not gallery-airy, since this is a scanning tool used for long sessions.

## Elevation & Depth

Revised from the original all-flat spec: movie cards and floating panels (the catalog search/
filter bar) carry a soft, two-layer shadow tinted from Ink rather than pure black
(`rgba(28,25,23,…)`), plus a hairline `ring-black/5` for a crisp edge - never a `neutral-border`
outline alone. Cards lift further on hover/focus (deeper shadow, slight upward translate, ring
tinted Amber) as interactive feedback. Modals/dialogs keep their own single, more pronounced
shadow layer to still read as the most elevated layer on the page. Static, non-interactive text
and inline controls (labels, plain body copy) stay flat; shadow is reserved for surfaces the user
scans or clicks into (cards, panels, modals), not for decoration.

## Motion

Motion serves feedback, state, and continuity - never decoration or page-load choreography
(Operate mode, per Emil Kowalski principles already stated in Overview). Foundation lives in
`frontend/src/styles/motion.ts` and the `@theme` block of `frontend/src/index.css`:

- **Reduced motion is systemic, not per-component.** Every spatial/decorative animation is written
  as a pair - `motion-safe:animate-*`/transform, plus `motion-reduce:animate-none` or a static
  end-state. Opacity/color transitions that carry state meaning (hover, press, selected, error)
  are not spatial and stay unconditional.
- **Universal press feedback.** Every clickable button/link uses the shared `pressableClass`
  (`active:scale-[0.98]`, 100ms) - the same convention as `focusRingClass` for focus rings.
- **Animation tokens** (`--animate-fade-rise`, `--animate-pop-in`, `--animate-menu-in`,
  `--animate-fade-in`, `--animate-toast-in`/`-out`): 150ms for routine state changes (menus,
  badges, checkmarks), 300-400ms for layout/overlay entrances (catalog grid, toasts), natural
  deceleration easing (`cubic-bezier(0.16, 1, 0.3, 1)`) on entrance, faster/accelerating on exit.
- **Never on high-frequency actions.** Pagination page-changes apply zero animation classes -
  the catalog grid's entrance animation is explicitly gated off on a pure page change (only fires
  when a filter/search/sort actually changed) rather than merely shortened.
- **Loading spinners** (`CircleNotch` + `animate-spin`) on in-flight submit/delete actions are a
  functional progress indicator, not an idle decorative loop, so they don't violate the
  never-decorative-loops rule.
- **Expand/collapse panels** use the CSS Grid `0fr → 1fr` accordion technique (never animate
  `height`/`max-height` directly), paired with the `inert` HTML attribute on the collapsed content
  so it stays out of the tab order and unclickable while visually hidden.

## Shapes

**The One Radius Rule.** Every card, input, button, and modal uses the same 8px radius
(`rounded.md`). The only exception is badges/pills (genre tags, rating chip), which use full
pill radius (`rounded.full`) - documented here as the one allowed deviation, never introduced
elsewhere.

## Do's and Don'ts

### Do:
- **Do** keep Amber as the only accent color across every screen.
- **Do** use Inter Variable (self-hosted) with the system stack as fallback; do not switch faces
  or add a second family without revisiting this file.
- **Do** keep buttons/cards/inputs on the single 8px radius scale.
- **Do** show a numeric 0-10 rating input/display; a 10-star continuous-fill widget mapped 1:1 to
  the 0-10 scale is acceptable, but never a 5-star widget implying a 1-5 scale.
- **Do** design empty/loading/error states for the catalog and detail views - the real dataset
  has movies with no poster (~9%) and no reviews (most of them); these are not edge cases.

### Don't:
- **Don't** introduce a second accent color or a purple/blue gradient.
- **Don't** mix Tailwind utilities with hand-written CSS files - Tailwind only, per the user's
  explicit constraint.
- **Don't** add dark mode in the MVP; it's an explicit phase-2 item, not silently in scope.
- **Don't** use a pure-black shadow, or a zero-offset/zero-blur shadow - always the tinted,
  soft two-layer treatment described in Elevation & Depth.
- **Don't** let Paper and Surface sit at near-identical lightness again - the contrast between
  them is what makes elevation legible; if a future palette tweak narrows that gap, cards will
  read flat again regardless of the shadow.
