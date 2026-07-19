# src/renderer — agent guide

React app (Mantine UI). Talks to the main process only through the typed
tRPC client in `src/api/trpc.ts` — never `window.electron.ipcRenderer`
directly except for the two menu event listeners in `AppShell.tsx`.

## Layout

- `domain/schemas/` — the Zod schemas (shared with main via the `@shared/*`
  alias, which points here). Edit an entity's shape here first; DB,
  validation, OpenAPI, and forms all follow from it.
- `autoform/` — `AutoForm.tsx` walks a Zod object schema and renders a
  Mantine input per field, inferring widget from the Zod type
  (`ZodEnum` → `Select`, `ZodNumber` → `NumberInput`, else `TextInput`).
  `uiSchema` (per-field `{ labelKey, widget }`) is the escape hatch for
  bespoke fields — see `widgets/`. Only scalar, directly-editable fields
  belong in an entity's `*EditableFieldsSchema` passed to `AutoForm`;
  composite things (image upload, the ingredient list) are separate
  sections in the page component, wired to their own tRPC mutations.
- `widgets/` — `AutoFormFieldProps`-shaped custom fields:
  `EmojiField` (frimousse), `BlockNoteField`. `RecipeImageField` is
  *not* used through `AutoForm` — it needs `recipeId` + its own upload
  mutation, so it's rendered directly in `RecipeEditPage`.
- `components/SearchList.tsx` — the shared keyboard-list primitive (search
  autofocus, live filter, arrow-key nav, Enter-to-open, virtualized via
  `@tanstack/react-virtual`). Both list pages (`features/recipes`,
  `features/ingredients`) are thin wrappers around it. Reuse this for any
  future entity list rather than rebuilding the keyboard behavior.
- `features/<entity>/` — one `*ListPage` + one `*EditPage` per entity.
  Edit pages follow the same shape: a `createNew` prop that fires the
  create mutation then `navigate(..., { replace: true })` to the real id
  (so autosave always has something to patch), and an inner `*Editor`
  component **keyed by id** (`<RecipeEditor key={routeId} ...>`) so
  switching between two records fully remounts local state instead of
  leaking the previous record's edits.
- `features/recipes/{NewIngredientRow,RecipeIngredientRow,RecipeIngredientsEditor}.tsx`
  — the ingredient-picker keyboard workflow (type → dropdown, first match
  pre-selected via Mantine `Combobox` → Enter moves to quantity → Enter
  commits and resets to a blank row). `NewIngredientRow` is the *draft*
  (uncommitted) row; `RecipeIngredientRow` is a persisted one, reorderable
  via `@dnd-kit`.
- `hooks/useAutosavePatch.ts` — the debounced background-save primitive.
  Call `schedule(partialPatch)` on every field change; patches within the
  window get merged into one mutation. Don't call the raw tRPC mutation
  directly from an `onChange` for anything the user types into.
- `i18n/` — `react-i18next` setup; add new strings to *both*
  `locales/en.json` and `locales/fr.json` in the same commit.
- `shortcuts/registry.ts` — the single list of every keyboard shortcut,
  read by both the `?` cheat-sheet modal and inline `<ShortcutHint>` chips.

## Conventions

- New entity screens: add the Zod schema, then follow the
  Ingredients feature as the reference implementation (simpler than
  Recipes — no composite widgets).
- Don't reach for `@tanstack/react-query` v5 patterns/APIs — this project
  is pinned to v4 to match `@trpc/react-query@10` (see root `AGENTS.md`).
