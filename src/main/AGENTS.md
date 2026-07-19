# src/main — agent guide

Electron main process. Node context, full FS/OS access, no DOM. Builds as
**CJS** (`.cjs`), not ESM — see root `AGENTS.md` for why; don't "fix" the
`format: 'cjs'` override in `electron.vite.config.ts`.

## Layout

- `index.ts` — app lifecycle, `BrowserWindow`, wires the tRPC IPC handler
  (`createIPCHandler` from `electron-trpc/main`), single-instance lock.
- `menu.ts` — native app menu, localized (en/fr). Rebuilt on demand via
  `setMenuActionHandlers`; menu items send IPC events
  (`app:change-folder`, `app:show-shortcuts`) the renderer listens for.
- `trpc/` — `context.ts` defines `TrpcContext` (the `WorkspaceManager` +
  `getMainWindow`); `router.ts` composes the sub-routers; `routers/*` are
  one file per entity, each just validating with the shared Zod schema and
  delegating to `ctx.workspace.activeDb.<entity>`.
- `workspace/workspace.ts` — `WorkspaceManager`: the only thing holding the
  currently-open `DbClient`. Recents are a hand-rolled JSON file (not
  electron-store — see root `AGENTS.md`).
- `db/client.ts` — the `DbClient`/`IngredientsRepository`/`RecipesRepository`
  interfaces. **This is the Postgres swap point.** Everything in `trpc/`
  depends only on this, never on `db/sqlite/*` directly.
- `db/sqlite/` — the only current `DbClient` implementation: Drizzle schema
  (`schema.ts`), repositories (`repositories.ts`), a from-scratch migration
  runner (`migrate.ts`) that applies bundled SQL (see below).
- `db/migrations/` — raw SQL from `drizzle-kit generate`, imported via
  Vite's `?raw` suffix and listed in `migrations/index.ts`. **Not** run
  through `drizzle-orm`'s file-based migrator (which expects a loose
  migrations folder on disk at runtime — awkward to guarantee inside a
  packaged app); instead `migrate.ts` applies the bundled SQL strings
  directly, tracked in a local `_migrations` table.

## Adding a procedure

1. Add/extend the Zod schema in `src/renderer/src/domain/schemas/*`
   (shared with the renderer — import via the `@shared/*` alias).
2. Add the method to the relevant repository interface in `db/client.ts`
   and implement it in `db/sqlite/repositories.ts`.
3. Add the tRPC procedure in `trpc/routers/*`, validating with the same
   Zod schema (`.input()`/`.output()`).
4. If it should show up in the API surface, add a `registerPath` entry to
   `scripts/generate-openapi.ts`.

## Gotchas

- `ctx.workspace.activeDb` throws if no workspace is open — always route
  through `requireDb(ctx)` (in `trpc/context.ts`), which turns that into a
  proper `TRPCError`.
- Timestamps are ISO strings, not native SQLite datetimes.
- Ingredient prices: never add an `UPDATE`; `addPrice` inserts, always.
