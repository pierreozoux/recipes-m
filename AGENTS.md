# recipes-m — agent guide

Desktop back office (Electron + React + TS) to CRUD recipes and ingredients.
Professional/keyboard-first UI, not user-facing/consumer-facing.

See also: `src/main/AGENTS.md`, `src/renderer/AGENTS.md`.

## Architecture

**API-first.** The renderer never touches the DB directly — it calls tRPC
procedures (`src/main/trpc`) over Electron IPC (`electron-trpc`). Today the
transport is IPC; the router could be remounted on HTTP later without
touching the renderer, if this ever needs to stop being an Electron app.

**Zod is the single source of truth.** One schema per entity
(`src/renderer/src/domain/schemas/*`) drives: tRPC input/output validation,
the Drizzle-backed repository layer, the auto-generated OpenAPI spec
(`pnpm gen:openapi`), and the auto-generated Mantine forms (`autoform/`).
Change the shape of an entity in exactly one place.

**DB is swappable.** Repositories implement `DbClient`
(`src/main/db/client.ts`). The only concrete implementation today is
`src/main/db/sqlite` (better-sqlite3 + Drizzle). Moving to Postgres later
means adding `src/main/db/postgres` implementing the same interface —
nothing above that layer (tRPC routers, renderer) changes.

**Workspace model.** A "recipe folder" = a directory with `recipes.sqlite`
+ `images/`. `WorkspaceManager` (`src/main/workspace/workspace.ts`) opens
one at a time; opening and creating are the same operation (ensure
structure, then open the DB).

## Key decisions & tradeoffs

- **tRPC v10, not v11.** `electron-trpc@0.7.1` (the only mature Electron IPC
  adapter) is built against v10's link contract; v11's client throws
  (`transformer.serialize` on undefined) through it. Confirmed by running
  the real app, not just typechecking. `@tanstack/react-query` is pinned to
  v4 to match `@trpc/react-query@10`'s peer requirement. Revisit if a
  v11-compatible fork matures.
- **Main/preload build as CJS, forced.** `electron.vite.config.ts` sets
  `rollupOptions.output.format: 'cjs'` and `.cjs` entry filenames for main
  and preload, overriding the root `"type": "module"`. electron-trpc's
  bundle statically imports both main- and preload-only symbols from
  `'electron'` in one module; Node's ESM loader rejects that at link time,
  CJS tolerates it.
- **No electron-store.** It (and its `conf` dependency) ship ESM-only,
  unusable from the CJS main bundle above. Recents are a hand-rolled
  JSON file in `app.getPath('userData')` — see `workspace.ts`. Don't
  reintroduce electron-store without re-checking this.
- **Native module ABI dance.** `better-sqlite3` must be compiled against
  Electron's Node ABI to run inside the app, but plain Node's ABI to run
  under Vitest. `postinstall`/`predev` rebuild for Electron;
  `pretest`/`posttest` flip to the system Node and back. If `pnpm test`
  and `pnpm dev` are interleaved manually (not via the scripts), rebuild
  again before trusting either.
- **HashRouter, not BrowserRouter.** The renderer loads from `file://` in
  production; a path-based router breaks there.
- **Autosave is debounced + best-effort, not durable.** Every field edit
  updates local state instantly, then schedules a merged-patch tRPC
  mutation after ~400ms (`useAutosavePatch`). A hard crash inside that
  window loses the change. This is an intentional tradeoff for
  responsiveness, per the product requirement — do not add sync/blocking
  saves to "fix" it.
- **Ingredient prices are append-only.** `ingredients.addPrice` always
  `INSERT`s, never `UPDATE`s; "current price" is the latest row (tie-broken
  by SQLite `rowid`, not just `createdAt`, since same-millisecond inserts
  are otherwise unordered — this was a real bug caught by the repository
  tests). Never add an `UPDATE` path for price.
- **Mantine over Ant Design / shadcn.** Chosen for built-in `useHotkeys`,
  `Spotlight` (command palette), and form primitives — least glue code for
  a keyboard-heavy back office.
- **BlockNote for rich text**, per product spec. Its code-block feature
  pulls in `shiki`, which adds a lot of lazily-loaded (never-triggered, for
  this app) language chunks to the build output. Known, accepted tradeoff;
  revisit only if installer size becomes a real problem.
- **Images as files, not BLOBs.** Stored under `<workspace>/images/`,
  referenced by filename from `recipes.image_path`. Served to the renderer
  as base64 data URLs via a tRPC query (`recipes.getImageDataUrl`), not
  `file://` URLs — those are unreliable to load from a renderer in both dev
  (Vite dev server origin) and prod without extra protocol wiring.
- **An agent session cannot push git tags via `git push`** (branch pushes
  work; `git push origin vX.Y.Z` 403s, confirmed by testing — reproduced
  even when a `main` push succeeded seconds earlier in the same script run,
  so it's a deliberate ref-level restriction, not a GitHub outage). Workaround
  that doesn't need a human: push the version-bump commit to `main`, then
  trigger `release.yml` via the GitHub Actions API (`workflow_dispatch` on
  `main`). electron-builder's GitHub publish step creates the release *and*
  the matching tag through the REST API (not `git push`) when neither exists
  yet for that version — confirmed working, tag ends up correctly pointing
  at the commit that was actually built. This only works the *first* time a
  version is published (if a release for that tag already exists, publish
  just uploads assets to it).

## Commands

`pnpm dev` · `pnpm build` · `pnpm test` (Vitest) · `pnpm test:e2e`
(Playwright, drives the packaged app — build first) · `pnpm typecheck` ·
`pnpm lint` · `pnpm gen:openapi` · `pnpm db:generate` (after editing
`src/main/db/sqlite/schema.ts`, then add the generated file to
`src/main/db/migrations/index.ts`) · `pnpm release` (see README "Cutting a
release" — infers the version bump from commit history, requires tag-push
access, so a human must run it, not an agent — see workaround above).

## Conventions

- **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)**
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, with `!`
  or a `BREAKING CHANGE:` footer for breaking changes). Not optional style —
  `pnpm release` (`commit-and-tag-version`) parses this history to pick the
  next version and write `CHANGELOG.md`. A non-conventional commit doesn't
  break anything but won't show up in the changelog.
- No comments unless they explain a non-obvious *why* (see examples above:
  ESM/CJS forcing, price tie-breaking, autosave tradeoff).
- i18n: every user-facing string goes through `react-i18next`, keys added
  to both `src/renderer/src/i18n/locales/{en,fr}.json`.
- Shared keyboard shortcuts are registered once in
  `src/renderer/src/shortcuts/registry.ts` — both the `?` cheat-sheet and
  `<ShortcutHint>` chips read from it. Don't hardcode a shortcut string in
  two places.
- Prefer extending an entity's Zod schema + repository + router together;
  don't bypass the repository layer from a tRPC procedure.
