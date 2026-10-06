# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Surmai is a personal/family travel organizer: a React SPA frontend backed by a Go/PocketBase backend. It's a
PWA (offline-capable, installable). The frontend is at the repo root (`src/`); the backend is a separate Go
module in `backend/`.

## Commands

### Frontend (run from repo root, pnpm)

- `pnpm dev` — start Vite dev server (proxies `/api` and `/site-settings.json` to the backend at
  `http://localhost:9090`, override with `PLAYWRIGHT_TEST_BACKEND`)
- `pnpm build` — typecheck (`tsc -b`) then `vite build`
- `pnpm lint` — ESLint, zero warnings allowed
- `pnpm format` — Prettier write on `./src`
- `pnpm test` — run unit tests once (Vitest); `pnpm test:watch` for watch mode
  - single test file: `pnpm test tests/unit/components/trip/transportation/AirportSelect.test.tsx`
- `pnpm test:e2e` — Playwright e2e tests (spins up frontend on :6173 and backend `go run . serve` on :8060
  automatically — don't start them yourself first)
  - single spec: `pnpm test:e2e tests/e2e/pages/ViewTrip/Notes.spec.ts`
  - `pnpm test:e2e:ui` / `pnpm test:e2e:debug` for interactive runs
- `pnpm sync-translations` — scan source for i18next keys and update locale files in `public/locales`
- `pnpm preview:pull` — snapshot a running instance (default `http://192.168.1.100:9090`, override with
  `SURMAI_PI_URL`) into `backend/pb_preview_data` via PocketBase's backup API, then disable the email-import
  and LLM settings in the copy. Never point the local backend at the live database — always work on this copy.
- `pnpm preview:serve` — run the local backend against that snapshot on port 9090, so `pnpm dev` previews
  local changes against real data

### Backend (run from `backend/`, Go)

- `go run . serve` — run the PocketBase server in dev mode (auto-migrate on, reads `backend/.env` if present
  via a copy/rename of `backend/dot-env`; never commit `backend/.env`)
- `go run . serve --http 0.0.0.0:8060` — specify a port
- `go build` — compile the backend binary
- `go test ./...` — run Go tests; `go test ./hooks/...` to scope to one package (the backend has no
  `_test.go` files yet, so the first backend test in a package also sets up its scaffolding)
- `go mod tidy` — sync dependencies after editing imports

### Repo-wide

- `mise` manages tool versions (node 24, go 1.26, pnpm 11) — see `mise.toml` for shell aliases (`dev`, `dc` for
  `docker compose -f docker-compose.dev.yaml`)
- Commits must follow Conventional Commits (enforced by commitlint via husky `commit-msg` hook); `pnpm test`
  runs on `pre-commit`
- `pnpm release` (release-it) cuts a release: bumps version, tags, creates a GitHub release

## Working practices

### Design

- Apply SOLID, DRY, YAGNI and KISS. Prefer the simplest change that satisfies the spec; no speculative
  abstractions or options.
- Do not add a dependency (npm or Go) without asking first.

### TDD

- Work test-first: write a failing test from the spec, make it pass, then refactor.
- For features and non-trivial fixes, split the work between two agents:
  1. A test agent writes the tests from the spec only. It does not look at or write the implementation.
  2. A code agent writes the implementation that makes those tests pass. It must not edit the tests; if a
     test looks wrong, it stops and reports instead of changing it.
  Trivial changes can be done by a single agent doing red-green-refactor.
- Where tests go: pure logic and components in Vitest (`tests/unit/`, mirroring `src/`), user flows in
  Playwright (`tests/e2e/`), backend in Go `_test.go` files next to the code under test.

### Definition of done

Before any commit, all of these pass: `pnpm lint`, `pnpm build`, `pnpm test`, and in `backend/`
`go vet ./... && go build ./... && go test ./...`.

### Git

- Conventional Commits, concise subject, body only when the why is not obvious.
- Never mention AI in commits, PRs, branch names or code: no `Co-Authored-By` trailer, no "Generated with"
  line.
- Work on a feature branch and open one PR per change; never commit directly to `main`.

### Project rules

- Migrations are immutable once shipped: never edit an existing file in `backend/migrations/`; add a new
  timestamped migration with a working down function.
- Access control is explicit: every new collection sets its API rules and every new route binds auth
  middleware, each with a test covering the denied case.
- i18n: every user-facing string goes through `t()`, then run `pnpm sync-translations`. Only edit the
  source locale (`public/locales/en-US`); Weblate owns the others.

## Architecture

### Backend: PocketBase app, extended in Go

The backend is [PocketBase](https://pocketbase.io) (an embeddable Go backend providing auth, a SQLite-backed
DB with realtime subscriptions, file storage, and an admin UI) with Surmai's domain logic layered on top in
`backend/`. Everything wires together in `backend/app/surmai.go` via the `SurmaiApp` struct, called from
`backend/main.go`:

- **`migrations/`** — one file per schema change, filename-prefixed with a Unix timestamp, registered via
  `m.Register(up, down)`. Collections (PocketBase's equivalent of DB tables) are defined with `core.NewBaseCollection`
  plus field lists, and access control is expressed as PocketBase rule strings (`ListRule`, `ViewRule`,
  `CreateRule`, etc.) directly on the collection — e.g. `ownerId = @request.auth.id || collaborators.id ?= @request.auth.id`.
  This is the source of truth for the data model; read relevant migrations before changing a collection's shape
  or access rules instead of guessing from frontend types.
- **`hooks/`** — `OnRecordCreate`/`OnRecordUpdate`/`OnRecordEnrich`/`*Request` handlers bound in
  `BindEventHooks()`, used for cross-cutting record behavior (e.g. computing destination timezones on trip
  save, enriching API responses with computed attributes like trip access, fanning out notifications).
- **`routes/`** — custom HTTP handlers for anything beyond PocketBase's generated CRUD API, bound in
  `BindRoutes()`. Route groups apply middleware for auth (`apis.RequireAuth()`, `apis.RequireSuperuserAuth()`)
  and trip access (`middleware.RequireTripAccess()`). Deep-link frontend routes (`/trips/{path...}`, `/settings`,
  etc.) are registered here to return `index.html` so React Router can take over client-side.
  `se.Router.GET("/{path...}", ...)` as the final catch-all serves the built frontend from `pb_public`.
  `backend/routes/show_index_page.go` is the serves-as-fallback-index-page handler.
- **`jobs/`** — cron jobs registered in `StartJobs()` (invitation cleanup, currency rate sync, demo data
  reset, scheduled email-booking import, expired content cleanup).
- **`assistant/`** — "import booking" parsing logic (flights, hotels, car rentals, parking, activities, generic
  transportation) used by the email-import job and manual import flows; talks to an LLM endpoint (OpenAI-compatible)
  configured via settings.
- **`middleware/`**, **`settings/`**, **`types/`**, **`datasets/`** (loaders for bundled airport/airline/place
  reference data), **`flights/`** (flight info provider), **`cache/`** — supporting packages.
- Deployment: `backend/init.sh` runs `migrate up` then starts the server with auto-migrate off — i.e. in
  production migrations are applied explicitly rather than automigrated (automigrate is dev-only, see
  `BindMigrations`).

### Frontend: React SPA talking to PocketBase directly

The frontend mostly talks to PocketBase's generated REST/realtime API directly via the `pocketbase` JS SDK,
falling back to the custom `backend/routes/*` endpoints only for operations PocketBase can't express (trip
export/import, ICS calendar generation, flight lookup, admin actions, etc.)

- **`src/lib/api/`** — the entire data-access layer. `src/lib/api/index.ts` re-exports a curated surface from
  per-domain modules in `src/lib/api/pocketbase/*.ts` (trips, lodgings, transportations, activities, expenses,
  traveller profiles, invitations, notifications, settings, auth, attachments, assistant). Always add new
  backend calls in the matching `pocketbase/*.ts` module and export through `index.ts` — components should
  import from `lib/api`, not reach into `lib/api/pocketbase/*` directly.
- **`src/lib/api/pocketbase/pocketbase.ts`** — two separate PocketBase client instances, `pb` (regular user,
  store name `pb_user`) and `pbAdmin` (superuser/admin actions, store name `pb_admin`), both pointed at
  `window.location.origin`. Use `pb` for normal user-scoped calls and `pbAdmin` only for admin/settings actions
  that require superuser auth.
- **`src/app/`** — app shell: `routes.tsx` (React Router route tree, heavier pages lazy-loaded), `Surmai.tsx` /
  `SurmaiContext.tsx` (top-level context incl. offline state consumed via `useSurmaiContext`), `theme.ts`
  (Mantine theme), `modals.ts`.
- **`src/auth/SecureRoute.tsx`** — gates the authenticated route tree: refreshes auth (skipped while offline or
  on `/login`/`/register`), loads the current user, redirects to `/login` on failure, and exposes
  `user`/`reloadUser` via `AuthContext` to descendants.
  - `src/pages/` — top-level routed pages; `src/components/` — everything else, organized by feature folder
  (`trip/transportation`, `trip/lodging`, `trip/activities`, `trip/expenses`, `settings`, `traveller`, `account`,
  `invitations`, `notifications`, `nav`, `upload`, `util`...). Trip sub-resources (lodging, transportation,
  activities) each follow a parallel pattern: a `*Panel.tsx` (list view), a `Generic*Data.tsx` (display), a
  `Generic*Form.tsx` or per-type `*Form.tsx` (edit), and a `typeIcons.ts`/`config.tsx` for per-subtype icon/config
  mapping — follow this pattern when adding a new transportation/lodging/activity subtype rather than inventing
  a new shape.
- **UI kit**: [Mantine](https://mantine.dev/) v9 (+ `@mantine/*` packages for dates, dropzone, tiptap editor,
  notifications, modals, carousel). Tiptap powers the rich-text trip notes editor
  (`src/components/trip/notes/`). Leaflet/`react-leaflet` powers maps (place selects, destination display).
- **i18n**: `react-i18next`, keys scanned via `i18next-scanner.config.json` into `public/locales`; translations
  are hosted on Weblate — don't hand-edit translated (non-source) locale files, only the source strings/keys.
- **PWA**: configured in `vite.config.ts` via `vite-plugin-pwa` — API calls and the PDF worker are cached
  `NetworkFirst`, realtime (websocket) requests are excluded from caching.

### Tests

- Unit tests (Vitest + Testing Library, jsdom) live in `tests/unit/`, mirroring `src/` structure; config and
  global setup in `vite.config.ts`'s `test` block and `vitest.setup.ts`.
- E2E tests (Playwright, Firefox) live in `tests/e2e/`, using a page-object pattern (`tests/e2e/pages/<Feature>/`
  pairs a `*Page.ts` page object with a `*.spec.ts` spec). The `authenticated-tests` project reuses stored auth
  state from `tests/e2e/auth.setup.ts`/`tests/playwright/.auth/user.json`; SignIn/SignUp specs run unauthenticated
  under their own project. Playwright's `webServer` config starts both the frontend (`pnpm test-web` on :6173)
  and a fresh backend instance (`go run . serve` on :8060, isolated `pb_test_data` dir) automatically — see
  `tests/e2e/README.md` for env vars (`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`) and how to scope a run.

## Conventions

- Prettier: single quotes, semicolons, trailing commas (es5), 120 print width — run `pnpm format` rather than
  hand-matching style.
- ESLint enforces import ordering/grouping (builtin/external, then internal/parent/sibling, then types,
  alphabetized with blank lines between groups) and prefers `import type` for type-only imports.
- Go backend code has no linter configured beyond `go vet`/`gofmt` defaults — match the existing style in
  `routes/`, `hooks/`, and `migrations/` (small single-purpose files, one exported function per file, file named
  after that function).
