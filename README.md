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

## Install

Download the installer for your OS from the
[Releases page](https://github.com/pierreozoux/recipes-m/releases) (built by
`.github/workflows/release.yml` whenever a `v*` tag is pushed):

| Platform | File | Notes |
|---|---|---|
| Windows | `recipes-m-Setup-*.exe` | Unsigned by default — SmartScreen may warn; click "More info" → "Run anyway". |
| macOS | `recipes-m-*.dmg` | Unsigned by default — right-click the app → "Open" the first time to bypass Gatekeeper. |
| Linux | `recipes-m-*.AppImage` or `.deb` | Make the AppImage executable (`chmod +x`) before running, or install the `.deb` with your package manager. |

Builds are unsigned unless the maintainer has configured signing secrets (see
[Releases](#releases) below) — this is expected for a self-hosted project and
doesn't affect functionality.

## Quickstart

1. Launch the app. On first run you'll be asked to **open** an existing
   recipe folder or **create** a new one — pick any empty directory; it will
   contain your `recipes.sqlite` database and an `images/` folder.
2. Switch to **Ingredients** and add a few: name, unit (`kg`/`l`), price, and
   an emoji icon. Every price edit is kept in history, never overwritten.
3. Switch to **Recipes**, create one, and fill in the description/steps
   (rich text) and the ingredient list — type to search, `Enter` to pick,
   `Enter` again to add a quantity and start the next row.
4. Everything autosaves as you type — there's no save button.
5. Press `?` anytime for the full keyboard shortcut cheat sheet, or `⌘K`
   (`Ctrl+K` on Windows/Linux) for the command palette.

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
a GitHub Release matching that tag (`electron-builder.yml` sets
`publish.releaseType: release`, so it publishes directly rather than
leaving a draft). Signing is optional — see the workflow for the secret
names it reads (`MAC_CSC_LINK`, `WIN_CSC_LINK`, Apple notarization keys);
without them, builds are produced unsigned.

### Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `chore:`, `docs:`, etc., with `!` or a `BREAKING CHANGE:`
footer for breaking changes). This isn't just style — the release process
below parses commit history to decide the next version and to write the
changelog, so it only works if commits follow the convention.

### Cutting a release

```sh
pnpm release
```

No version number to pick. `scripts/release.sh` checks the tree is clean
and `main` is up to date with `origin/main`, runs `pnpm typecheck && pnpm
test`, then runs [`commit-and-tag-version`](https://github.com/absolute-version/commit-and-tag-version),
which reads Conventional Commits since the last `v*` tag to infer the bump
(`fix` → patch, `feat` → minor, a breaking change → major), updates
`package.json`, prepends `CHANGELOG.md`, commits, and tags `vX.Y.Z` — then
the script pushes both. Pushing the tag is what triggers the release build
(`.github/workflows/release.yml` on `tags: v*`).

If there are no commits since the last tag, the script refuses — there's
nothing to release.

**Humans** with normal git push access: this is the whole process, nothing
else to do.

**Agent sessions**: the branch push succeeds but the tag push 403s (see
`AGENTS.md`, "Key decisions & tradeoffs" — a deliberate restriction, not a
bug or an outage). Don't re-run `pnpm release` to retry — the version bump,
changelog, commit, and local tag already happened; re-running would bump
the version again on top of an unreleased one. Instead, since the
version-bump commit is already on `main`, trigger `release.yml` directly
via `workflow_dispatch` (GitHub Actions API, ref `main`). electron-builder's
GitHub publish step creates the release *and* the `vX.Y.Z` tag itself
(via the REST API, not `git push`) the first time that version is
published, so the tag ends up correctly pointing at the commit that was
actually built.
