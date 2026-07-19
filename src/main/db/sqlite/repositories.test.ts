import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DbClient } from '../client'
import { createSqliteDbClient } from './index'

describe('SqliteIngredientsRepository', () => {
  let db: DbClient

  beforeEach(() => {
    db = createSqliteDbClient(':memory:')
  })

  afterEach(() => db.close())

  it('creates and lists an ingredient with no price yet', async () => {
    const created = await db.ingredients.create({ name: 'Flour', unit: 'kg', icon: '🌾' })
    expect(created.name).toBe('Flour')
    expect(created.currentPrice).toBeNull()

    const list = await db.ingredients.list()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(created.id)
  })

  it('never overwrites price history: addPrice always appends a new row', async () => {
    const created = await db.ingredients.create({ name: 'Butter', unit: 'kg', icon: '🧈' })

    await db.ingredients.addPrice({ ingredientId: created.id, price: 5, currency: 'EUR' })
    await db.ingredients.addPrice({ ingredientId: created.id, price: 6, currency: 'EUR' })
    await db.ingredients.addPrice({ ingredientId: created.id, price: 7, currency: 'EUR' })

    const history = await db.ingredients.listPriceHistory(created.id)
    expect(history).toHaveLength(3)
    expect(history.map((p) => p.price).sort()).toEqual([5, 6, 7])

    const withPrice = await db.ingredients.getById(created.id)
    expect(withPrice?.currentPrice?.price).toBe(7)
  })

  it('creating with an initialPrice records it as the first history entry', async () => {
    const created = await db.ingredients.create({ name: 'Sugar', unit: 'kg', icon: '🍬', initialPrice: 2.5 })
    expect(created.currentPrice?.price).toBe(2.5)
    const history = await db.ingredients.listPriceHistory(created.id)
    expect(history).toHaveLength(1)
  })

  it('updates name/unit/icon without touching price history', async () => {
    const created = await db.ingredients.create({ name: 'Milk', unit: 'l', icon: '🥛' })
    await db.ingredients.addPrice({ ingredientId: created.id, price: 1.2, currency: 'EUR' })

    const updated = await db.ingredients.update({ id: created.id, name: 'Whole Milk' })
    expect(updated.name).toBe('Whole Milk')
    expect(updated.unit).toBe('l')
    expect(updated.currentPrice?.price).toBe(1.2)
  })

  it('removes an ingredient', async () => {
    const created = await db.ingredients.create({ name: 'Salt', unit: 'kg', icon: '🧂' })
    await db.ingredients.remove(created.id)
    expect(await db.ingredients.getById(created.id)).toBeNull()
  })
})

describe('SqliteRecipesRepository', () => {
  let db: DbClient

  beforeEach(() => {
    db = createSqliteDbClient(':memory:')
  })

  afterEach(() => db.close())

  it('creates a recipe with empty description/steps and no ingredients', async () => {
    const recipe = await db.recipes.create({ name: 'Pancakes' })
    expect(recipe.description).toEqual([])
    expect(recipe.steps).toEqual([])

    const withIngredients = await db.recipes.getById(recipe.id)
    expect(withIngredients?.ingredients).toEqual([])
  })

  it('adds, updates, reorders and removes recipe ingredients', async () => {
    const recipe = await db.recipes.create({ name: 'Omelette' })
    const eggs = await db.ingredients.create({ name: 'Eggs', unit: 'kg', icon: '🥚' })
    const salt = await db.ingredients.create({ name: 'Salt', unit: 'kg', icon: '🧂' })

    const row1 = await db.recipes.addIngredient({
      recipeId: recipe.id,
      ingredientId: eggs.id,
      quantityPerPerson: 2
    })
    const row2 = await db.recipes.addIngredient({
      recipeId: recipe.id,
      ingredientId: salt.id,
      quantityPerPerson: 0.01
    })

    let withIngredients = await db.recipes.getById(recipe.id)
    expect(withIngredients?.ingredients.map((r) => r.id)).toEqual([row1.id, row2.id])

    await db.recipes.reorderIngredients({ recipeId: recipe.id, orderedIds: [row2.id, row1.id] })
    withIngredients = await db.recipes.getById(recipe.id)
    expect(withIngredients?.ingredients.map((r) => r.id)).toEqual([row2.id, row1.id])

    await db.recipes.updateIngredient({ id: row1.id, quantityPerPerson: 3 })
    withIngredients = await db.recipes.getById(recipe.id)
    expect(withIngredients?.ingredients.find((r) => r.id === row1.id)?.quantityPerPerson).toBe(3)

    await db.recipes.removeIngredient(row2.id)
    withIngredients = await db.recipes.getById(recipe.id)
    expect(withIngredients?.ingredients.map((r) => r.id)).toEqual([row1.id])
  })

  it('updates name, description and steps independently', async () => {
    const recipe = await db.recipes.create({ name: 'Toast' })
    const updated = await db.recipes.update({
      id: recipe.id,
      description: [{ type: 'paragraph', content: 'Simple toast' }]
    })
    expect(updated.name).toBe('Toast')
    expect(updated.description).toEqual([{ type: 'paragraph', content: 'Simple toast' }])
    expect(updated.steps).toEqual([])
  })

  it('removes a recipe', async () => {
    const recipe = await db.recipes.create({ name: 'Soup' })
    await db.recipes.remove(recipe.id)
    expect(await db.recipes.getById(recipe.id)).toBeNull()
  })
})
