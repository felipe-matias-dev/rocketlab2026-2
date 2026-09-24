# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repository.

## What this is

Internal admin tool for a movie-review catalog (Letterboxd-inspired), built for the Visagio
RocketLab 2026.2 dev module (`requisitos.md` has the original assignment brief in Portuguese).
Single Administrator role, no end-user/visitor role. Full product context lives in
[`PRODUCT.md`](PRODUCT.md); visual/design rules live in [`DESIGN.md`](DESIGN.md). Read both
before making product or UI decisions — don't re-derive what's already answered there.

**Stack:** FastAPI + SQLAlchemy (async) + Alembic + SQLite (`backend/`), Vite + React +
TypeScript + Tailwind CSS (`frontend/`). Backend serves `/api/v1`, consumed by the frontend over
CORS (`http://localhost:5173` allowed by default).

## Hard constraints (do not violate silently)

- **Rating scale is 0-10**, not 1-5/5-star. Enforced by a DB `CheckConstraint`; any rating UI
  must reflect this.
- **No authentication in MVP scope.** Don't add login/auth unless explicitly asked — it's an
  intentional, documented deferral (see `PRODUCT.md`), not an oversight.
- **Tailwind only** on the frontend — no hand-written CSS files, no CSS-in-JS.
- **One accent color** (amber) across the whole UI — see `DESIGN.md` for the full palette/token
  list before styling anything new.
- The real seeded dataset is large (~95k movies, ~44k reviews) and messy (e.g. ~65k distinct
  "director" name rows, many malformed from the source CSVs). Never assume a handful of clean
  fixture rows — design empty/missing-data states deliberately, and prefer paginated/searchable
  UI over full-list dropdowns for anything backed by that scale.

## Development commands

### Backend (`backend/`, Windows venv at `backend/.venv`)

```
.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000   # dev server
.venv/Scripts/python.exe -m pytest tests/ -q                    # tests
.venv/Scripts/python.exe -m ruff check app                      # lint
.venv/Scripts/python.exe -m alembic upgrade head                 # apply migrations
.venv/Scripts/python.exe -m scripts.seed                         # reload CSV seed data (from backend/)
```

SQLite + Alembic gotcha: SQLite refuses `ALTER TABLE ADD COLUMN` with a non-constant default
(e.g. `CURRENT_TIMESTAMP`). Use `op.batch_alter_table(...)` in the migration, which rebuilds the
table instead of running a bare `ALTER TABLE`.

### Frontend (`frontend/`)

```
npm run dev             # Vite dev server (default port 5173; CORS is only configured for this one)
npx tsc --noEmit         # type-check
npm run lint             # oxlint
npm run build            # tsc -b && vite build
```

Always run `tsc --noEmit` and `npm run lint` after frontend changes, and the pytest+ruff pair
after backend changes, before considering work done.

### Verifying UI changes

For any frontend-visible change, actually drive it in a browser (chrome-devtools MCP is
available) before calling it finished — type-checking and lint verify correctness, not that the
feature works. Check the real network requests/responses, not just that the page renders.

## Known environment gotchas (Windows)

- `pkill` does not work in this environment. To kill a process by port, use
  `netstat -ano | grep ":<port>"` to find the PID, then `taskkill //F //PID <pid>`.
- Dev server ports (5173 for Vite, 8000 for uvicorn) can be left occupied by a **stale process
  from an earlier session** that is silently serving old code. If a running dev server behaves
  as if recent edits aren't there (e.g. a new query param is silently ignored), check
  `netstat -ano` for a leftover process on that port before assuming the code is wrong — compare
  against `/openapi.json`'s parameter list for the backend, or just restart cleanly.

## Architecture notes

- Backend data model is a star schema (`backend/app/movies/models.py`): `DimMovie` is the fact
  table's dimension of record; genres, companies and people (including directors) are all
  many-to-many via bridge tables, not FK columns on `DimMovie`. Director is a `DimPerson` row
  filtered by `tipo_pessoa == "Diretor"`, not a separate field.
- `backend/app/movies/service.py` holds all query logic (filtering, sorting, aggregation);
  `backend/app/api/v1/endpoints/` is a thin HTTP layer over it. Follow that split for new
  endpoints rather than putting query logic in the route handler.
- Frontend has no state management library — plain `useState`/`useEffect` with debounce timers
  for search/filter inputs (see `CatalogPage.tsx`). Keep following that pattern rather than
  introducing Redux/Zustand/React Query for a tool this size.

## Collaboration style

- Work in small, checkpointed increments — one screen/endpoint/component at a time, confirmed
  before moving to the next. Don't batch multiple unrelated features into one uninterrupted pass.
- Flag data-quality or environment surprises (like the messy director data, or a stale dev
  server) as soon as they're found, with the concrete evidence — don't silently work around them.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <summary>`, imperative
mood, summary under ~70 chars. Common types here:

- `feat:` — new user-facing capability (e.g. `feat: add genre and director filters to catalog`)
- `fix:` — bug fix (e.g. `fix: correct ascending/descending sort icon`)
- `refactor:` — internal restructuring, no behavior change
- `test:` — test-only changes
- `docs:` — README/CLAUDE.md/PRODUCT.md/DESIGN.md changes
- `chore:` — tooling, deps, config, migrations with no feature content of their own

Add a scope when it disambiguates (`feat(backend): ...`, `fix(frontend): ...`) on a mixed
backend+frontend change touching both isn't unusual here — only scope it if the message would
otherwise be ambiguous about which side changed.
