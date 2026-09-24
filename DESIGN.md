<!-- SEED: established directly with the user (Operate-mode admin tool; lighter direct path chosen over the full new-work concept-tournament workshop, since this surface has no brand identity at stake) before implementation. Re-run `/impeccable document` in scan mode once the frontend has real code, to extract actual tokens/components. -->

---
name: RocketLab Movie Admin
description: Internal admin panel for managing a movie catalog and its reviews
colors:
  accent: "#f59e0b"
  accent-hover: "#d97706"
  neutral-bg: "#fafafa"
  neutral-surface: "#ffffff"
  neutral-border: "#e4e4e7"
  neutral-text: "#18181b"
  neutral-text-muted: "#71717a"
  destructive: "#dc2626"
  success: "#059669"
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
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
requirement in the MVP, no external font dependency, no 5-star iconography (the rating scale is
numeric 0-10, not 1-5 stars - see PRODUCT.md).

**Key Characteristics:**
- Neutral zinc surfaces with a single warm amber accent, used consistently everywhere (buttons,
  links, active states, rating emphasis) rather than scattered accent colors.
- System font stack only - zero web-font dependency, instant render.
- One corner-radius scale throughout, with pill shape reserved for badges/tags only.
- Motion exists but is restrained and purposeful (Emil Kowalski principles): short, eased
  transitions on interactive feedback, never decorative loops, never on high-frequency actions
  like pagination.

## Colors

Restrained strategy: one neutral family (Zinc) carries the whole surface, one accent (Amber)
carries every actionable and rating-related emphasis, and two semantic colors (red, emerald)
are reserved strictly for destructive/success feedback, never used as decoration.

### Primary
- **Amber** (`#f59e0b`, hover `#d97706`): primary buttons, links, active nav state, star/rating
  emphasis, focus rings. Used identically across every screen (Color Consistency Lock).

### Neutral
- **Paper** (`#fafafa`): page background.
- **Surface** (`#ffffff`): cards, modals, form panels.
- **Border** (`#e4e4e7`): dividers, card outlines, input borders at rest.
- **Ink** (`#18181b`): primary text.
- **Ink Muted** (`#71717a`): secondary text, helper text, metadata (year, review count).

### Named Rules
**The One Accent Rule.** Amber is the only brand accent on the page. Destructive (red) and
success (emerald) are semantic status colors, never substitutes for the brand accent and never
used decoratively.

## Typography

**Body Font:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

**Character:** A workhorse system stack, chosen deliberately for an Operate-mode tool - legible,
instant to render, zero layout shift from web-font loading. No display/headline font is
introduced; hierarchy comes from weight and size within the same family, not a second typeface.

### Hierarchy
- **Title** (600, 1.5rem-1.875rem, 1.2 line-height): page titles, movie title on detail view.
- **Body** (400, 1rem, 1.5 line-height): catalog cards, form fields, review text.
- **Label** (500, 0.875rem, uppercase off): form labels, table/card metadata.

## Layout

Standard content width capped at `max-w-7xl`, centered. Catalog renders as a responsive CSS
grid (never flex-percentage math), collapsing to a single column below `md`. Spacing scale is
Tailwind's default (`spacing.sm/md/lg` above map to `2/4/6`); section padding stays moderate
(`py-8`-`py-12`), not gallery-airy, since this is a scanning tool used for long sessions.

## Elevation & Depth

Flat by default. Cards are distinguished by a 1px `neutral-border` outline, not a shadow.
Modals/dialogs get a single soft shadow layer to read as genuinely elevated above the page;
everything else stays flat.

## Shapes

**The One Radius Rule.** Every card, input, button, and modal uses the same 8px radius
(`rounded.md`). The only exception is badges/pills (genre tags, rating chip), which use full
pill radius (`rounded.full`) - documented here as the one allowed deviation, never introduced
elsewhere.

## Do's and Don'ts

### Do:
- **Do** keep Amber as the only accent color across every screen.
- **Do** use the system font stack; do not add a web font later without revisiting this file.
- **Do** keep buttons/cards/inputs on the single 8px radius scale.
- **Do** show a numeric 0-10 rating input/display, never a 5-star widget implying a 1-5 scale.
- **Do** design empty/loading/error states for the catalog and detail views - the real dataset
  has movies with no poster (~9%) and no reviews (most of them); these are not edge cases.

### Don't:
- **Don't** introduce a second accent color or a purple/blue gradient.
- **Don't** mix Tailwind utilities with hand-written CSS files - Tailwind only, per the user's
  explicit constraint.
- **Don't** add dark mode in the MVP; it's an explicit phase-2 item, not silently in scope.
- **Don't** use card shadows at rest; reserve shadow for modals only.
