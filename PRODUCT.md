# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, styled with Tailwind CSS (no plain CSS mixed in). Mandated by the
assignment brief (`requisitos.md`); not a delegated choice. Backend is a separate FastAPI
service (already built) consumed over `/api/v1`.

## Users

A single role: the Administrator. There is no end-user/visitor role and no authentication in
the MVP scope. The admin manages the movie catalog and can add reviews (reviews carry a free-text
reviewer name, not an account) — confirmed directly by `requisitos.md`.

## Product Purpose

An internal admin tool for a movie-review catalog (Letterboxd-inspired), built as the dev
module of the Visagio RocketLab 2026.2 training program. Purpose is to demonstrate a working
full-stack CRUD system over a pre-loaded, real movie dataset (~95k movies imported from CSV),
not to serve public users. Success = the 7 mandatory requirements work end-to-end and the code
is graded as competent, deliberate engineering work.

## Positioning

Not a competitive product; no market positioning applies. It exists to demonstrate the author's
command of the required stack (FastAPI + SQLAlchemy/Alembic backend, Vite/React/TS/Tailwind
frontend) against a realistic, non-trivial star-schema dataset, not a toy fixture set.

## Operating Context

Runs locally during development and grading: `uvicorn` backend on `localhost:8000`, Vite dev
server on `localhost:5173` (CORS already configured for this origin). The admin browses a large
paginated catalog, opens a movie's detail view (full metadata + review history), searches by
title, creates/edits/deletes movies, and adds reviews. No mobile-app or offline context; this is
a browser tool used at a desk during evaluation.

## Capabilities and Constraints

Confirmed via `requisitos.md` and the approved implementation plan:
- Movie CRUD (create, list paginated, view detail, update, delete).
- Title search (partial, case-insensitive).
- Reviews: add a review (name, rating, free-text comment) to a movie; view a movie's review
  history; average rating shown per movie, computed live (not from a stale snapshot).
- Rating scale is 0-10 (course staff explicitly overrode the brief's looser "0 a 5" mention;
  the DB's `CheckConstraint` already enforces 0-10). Any rating input control must reflect this
  scale, not a 5-star convention that implies 1-5.
- Movie genre is chosen from a fixed existing list (`GET /genres`); a movie's director is
  free-text with get-or-create semantics server-side. Cast/crew beyond director are read-only
  data imported from CSV, not editable via the admin form in the MVP.
- Explicitly out of scope for the MVP (may return as a later phase, not now): automated test
  coverage beyond the backend's own suite, authentication, advanced filters, storybook,
  response caching.

## Brand Commitments

None. No existing name, logo, palette, or voice constraints. The product is referred to
generically as a movie catalog/review admin tool; no fictional brand name should be invented
for it.

## Evidence on Hand

Real, non-trivial dataset already seeded into the local SQLite DB: ~95,645 movies with real
titles, synopses, release dates/years, and (for ~87k of them) real TMDB poster/backdrop image
URLs (`https://image.tmdb.org/t/p/...`) usable directly as `<img>` sources. ~43,666 real reviews
(Portuguese-language reviewer names and comments) and 19 genres already exist and are queryable
via the built endpoints. No design mockups, logo, or existing frontend exist yet; this is a
from-scratch build. State explicitly: do not fabricate customer testimonials, pricing, or
company logos anywhere in this product — none of that applies to an internal grading tool.

## Product Principles

1. Correctness and legibility of the required workflows outrank visual flourish - this is an
   Operate-mode admin tool (per Impeccable's mode taxonomy), not a marketing surface.
2. Every screen must work against the real seeded scale (tens of thousands of movies, posters
   frequently missing for ~9% of titles, reviews absent for most movies) - never assume a
   handful of clean fixture rows.
3. The 0-10 rating scale is a hard constraint from course staff, not a style choice; no UI
   pattern may silently imply a 1-5 or 5-star scale.
4. Build in small, checkpointed increments matching the backend's established pattern (one
   screen/component at a time, reviewed before the next), per the user's explicit preference
   for deliberate, non-autonomous collaboration.

## Accessibility & Inclusion

No project-specific accessibility requirement was stated by the course. Standard web a11y
practice (contrast, keyboard navigation, semantic form labeling) applies as general hygiene,
not as a specially scoped requirement.
