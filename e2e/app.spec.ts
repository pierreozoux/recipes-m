import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { _electron as electron } from 'playwright'

let electronApp: ElectronApplication
let window: Page
let workspaceDir: string

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  workspaceDir = mkdtempSync(join(tmpdir(), 'recipes-m-e2e-'))

  electronApp = await electron.launch({
    args: [join(process.cwd(), 'out', 'main', 'index.cjs'), '--no-sandbox'],
    env: { ...process.env, RECIPES_M_E2E: '1' }
  })

  // Native OS folder pickers aren't part of the web content Playwright can
  // drive, so stub the main-process dialog before the renderer calls it.
  await electronApp.evaluate(async ({ dialog }, dir) => {
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [dir] })) as typeof dialog.showOpenDialog
  }, workspaceDir)

  window = await electronApp.firstWindow()
  await window.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await electronApp.close()
  rmSync(workspaceDir, { recursive: true, force: true })
})

test('opens to the workspace picker and creates a recipe folder', async () => {
  await expect(window.getByRole('heading', { name: 'recipes-m' })).toBeVisible()
  await window.getByRole('button', { name: /create recipe folder/i }).click()
  await expect(window).toHaveURL(/#\/recipes/, { timeout: 10_000 })
})

test('creates an ingredient, autosaves edits, and appends price history', async () => {
  await window.getByRole('link', { name: 'Ingredients' }).click()
  await expect(window).toHaveURL(/#\/ingredients/)

  await window.getByRole('button', { name: 'New' }).click()
  await expect(window).toHaveURL(/#\/ingredients\/.+/)

  const nameInput = window.getByLabel('Name')
  await nameInput.fill('Flour')
  await expect(window.getByText('Saved')).toBeVisible({ timeout: 3000 })

  const priceInput = window.getByLabel('New price', { exact: true })
  await priceInput.fill('3.5')
  await window.getByRole('button', { name: 'Record new price' }).click()
  await expect(window.getByText('3.50 EUR')).toBeVisible()

  await priceInput.fill('4')
  await window.getByRole('button', { name: 'Record new price' }).click()
  await expect(window.getByText('4.00 EUR')).toBeVisible()
  // Both prices remain in history — nothing was overwritten.
  await expect(window.getByText('3.50 EUR')).toBeVisible()

  await window.getByRole('link', { name: 'Ingredients' }).click()
  await expect(window.getByText('Flour')).toBeVisible()
})

test('creates a second ingredient for use in a recipe', async () => {
  await window.getByRole('button', { name: 'New' }).click()
  await window.getByLabel('Name').fill('Egg')
  await expect(window.getByText('Saved')).toBeVisible({ timeout: 3000 })
  await window.getByRole('link', { name: 'Ingredients' }).click()
})

test('creates a recipe, types into the description, and adds an ingredient via the keyboard', async () => {
  await window.getByRole('link', { name: 'Recipes' }).click()
  await window.getByRole('button', { name: 'New' }).click()
  await expect(window).toHaveURL(/#\/recipes\/.+/)

  await window.getByLabel('Name').fill('Pancakes')
  await expect(window.getByText('Saved')).toBeVisible({ timeout: 3000 })

  const description = window.locator('.bn-editor').first()
  await description.click()
  await window.keyboard.type('Fluffy weekend pancakes')
  await expect(window.getByText('Saved')).toBeVisible({ timeout: 3000 })

  // Ingredient picker: type to search, first match pre-selected, Enter moves
  // to quantity, Enter again commits the row and resets to a blank search box.
  const ingredientSearch = window.getByPlaceholder('Type an ingredient…')
  await ingredientSearch.click()
  await ingredientSearch.fill('Flo')
  await window.keyboard.press('Enter')
  await window.keyboard.type('120')
  await window.keyboard.press('Enter')

  await expect(window.getByRole('textbox', { name: 'Qty / person' })).toHaveValue('120')
  await expect(ingredientSearch).toHaveValue('')

  await window.getByRole('link', { name: 'Recipes' }).click()
  await expect(window.getByText('Pancakes')).toBeVisible()
})

test('search list: typing filters and Enter opens the first match', async () => {
  const search = window.getByPlaceholder('Search recipes…')
  await expect(search).toBeFocused()
  await search.fill('pan')
  await window.keyboard.press('Enter')
  await expect(window).toHaveURL(/#\/recipes\/.+/)
  await expect(window.getByLabel('Name')).toHaveValue('Pancakes')
})

test('icon picker: opens, loads emoji data, and selecting an emoji updates the ingredient icon', async () => {
  await window.getByRole('link', { name: 'Ingredients' }).click()
  await window.getByText('Egg').dblclick()
  await expect(window.getByLabel('Name')).toHaveValue('Egg')

  const iconButton = window.getByRole('button', { name: 'Icon' })
  await iconButton.click()

  const search = window.locator('.emoji-picker-search')
  await expect(search).toBeVisible()
  await search.fill('pizza')

  // Regression guard: the picker's emoji data is fetched at runtime, so if
  // it's ever blocked (e.g. by CSP) this stays stuck on the loading state.
  const firstEmoji = window.getByRole('gridcell').first()
  await expect(firstEmoji).toBeVisible({ timeout: 15_000 })
  const pickedEmoji = await firstEmoji.textContent()
  await firstEmoji.click()

  await expect(iconButton).not.toHaveText('🥕')
  await expect(iconButton).toHaveText(pickedEmoji ?? '')
  await expect(window.getByText('Saved')).toBeVisible({ timeout: 3000 })
})

test('recipe view: creating a not-found ingredient inline adds it to the recipe and the ingredient list', async () => {
  await window.getByRole('link', { name: 'Recipes' }).click()
  await window.getByText('Pancakes').dblclick()
  await expect(window).toHaveURL(/#\/recipes\/.+/)

  const ingredientSearch = window.getByPlaceholder('Type an ingredient…')
  await ingredientSearch.click()
  await ingredientSearch.fill('Butter')

  await expect(window.getByRole('option', { name: 'Create "Butter"' })).toBeVisible()
  await window.getByRole('option', { name: 'Create "Butter"' }).click()

  await window.keyboard.type('20')
  await window.keyboard.press('Enter')

  await expect(window.getByText('Butter').first()).toBeVisible()
  await expect(ingredientSearch).toHaveValue('')

  await window.getByRole('link', { name: 'Ingredients' }).click()
  await expect(window.getByText('Butter').first()).toBeVisible()
})

test('recipe view: shows the ingredient unit next to its quantity', async () => {
  await window.getByRole('link', { name: 'Recipes' }).click()
  await window.getByText('Pancakes').dblclick()
  await expect(window).toHaveURL(/#\/recipes\/.+/)

  // Flour, Egg, and Butter are all 'kg' ingredients already in this recipe —
  // any visible instance confirms the unit renders next to the quantity.
  await expect(window.getByText('kg', { exact: true }).first()).toBeVisible()
})
