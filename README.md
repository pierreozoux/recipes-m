# recipes-m

A professional, keyboard-driven desktop back office for managing recipes and
ingredients. Built with Electron + React + TypeScript, API-first (tRPC +
generated OpenAPI spec) on top of a swappable SQLite/Drizzle data layer.

## Features

- **Workspace-based**: on launch, open or create a "recipe folder" containing
  a `recipes.sqlite` database and an `images/` folder. Recent folders are
  remembered.
- **Recipes & Ingredients** CRUD, with a shared keyboard-first list UX:
  search is auto-focused, typing filters live, the first match is
  pre-selected, `↑`/`↓` navigate, `Enter` opens the item.
- **Autosave**: every edit is saved in the background (debounced), never
  blocking the UI.
- **Ingredient price history**: editing a price never overwrites — it
  appends a new entry, so full history is preserved.
- **Recipe ingredients**: type to search, `Enter` moves to the quantity
  field, `Enter` again commits the row and opens a new one; `Tab` on an
  empty row removes it; rows are drag-reorderable.
- **Rich text**: recipe description and steps use a BlockNote editor.
- **i18n**: English and French, including the native app menu.
- **Keyboard shortcuts** everywhere, with a `?` cheat-sheet overlay and a
  `⌘K` command palette.

## Architecture

```
src/
  main/            Electron main process: tRPC router, SQLite/Drizzle repos,
                    workspace (folder) management, native menu
  preload/          contextBridge + electron-trpc IPC bridge
  renderer/src/
    domain/schemas/ Zod schemas — the single source of truth for validation,
                    the DB layer, the OpenAPI spec, and the auto-generated forms
    api/            typed tRPC client
    autoform/       Zod → Mantine form generator, with a widget-override escape hatch
    widgets/        BlockNote, emoji picker, image upload custom fields
    features/       workspace / recipes / ingredients screens
    components/     SearchList (keyboard list), shortcuts UI
```

The renderer only ever talks to the DB through tRPC procedures, which in turn
only depend on a `DbClient` repository interface
(`src/main/db/client.ts`). The current implementation
(`src/main/db/sqlite`) is SQLite via Drizzle; swapping to Postgres later
means adding a `src/main/db/postgres` implementation of the same interface —
nothing above that layer changes.

Run `pnpm gen:openapi` to generate `openapi.json` from the same Zod schemas
used for validation and the DB layer, proving the data model is API-describable
independent of the current Electron/IPC transport.

## Development

Requires Node 20+ and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

Other scripts:

| Command | Description |
|---|---|
| `pnpm dev` | Start the app in development (hot reload) |
| `pnpm build` | Typecheck + build the renderer/main/preload bundles |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run end-to-end tests (Playwright, drives the packaged app) |
| `pnpm typecheck` | Typecheck main + renderer |
| `pnpm gen:openapi` | Generate `openapi.json` from the Zod schemas |
| `pnpm db:generate` | Regenerate SQL migrations from the Drizzle schema |
| `pnpm build:win` / `:mac` / `:linux` | Build a local installer for the given platform |

### Native module note

`better-sqlite3` is a native addon that must be compiled against the ABI of
whichever runtime executes it — Electron's bundled Node for the app itself,
the system Node for Vitest. `postinstall`/`predev` rebuild it for Electron;
`pretest`/`posttest` temporarily rebuild it for the system Node around the
unit test run. This is handled automatically by the npm scripts above.

## Releases

Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds and
publishes signed-if-configured installers for macOS, Windows, and Linux to
a GitHub Release. Signing is optional — see the workflow for the secret
names it reads (`MAC_CSC_LINK`, `WIN_CSC_LINK`, Apple notarization keys);
without them, builds are produced unsigned.
