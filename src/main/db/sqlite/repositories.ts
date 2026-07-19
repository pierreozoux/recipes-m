import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type {
  AddIngredientPriceInput,
  CreateIngredientInput,
  IngredientPrice,
  IngredientWithPrice,
  UpdateIngredientInput
} from '@shared/schemas/ingredient'
import type {
  AddRecipeIngredientInput,
  CreateRecipeInput,
  Recipe,
  RecipeIngredient,
  RecipeWithIngredients,
  ReorderRecipeIngredientsInput,
  UpdateRecipeInput,
  UpdateRecipeIngredientInput
} from '@shared/schemas/recipe'
import { EMPTY_BLOCKNOTE_DOCUMENT } from '@shared/schemas/recipe'
import type { IngredientsRepository, RecipesRepository } from '../client'
import * as schema from './schema'

type Db = BetterSQLite3Database<typeof schema>

function now(): string {
  return new Date().toISOString()
}

function toIngredientPrice(row: typeof schema.ingredientPrices.$inferSelect): IngredientPrice {
  return {
    id: row.id,
    ingredientId: row.ingredientId,
    price: row.price,
    currency: row.currency,
    createdAt: row.createdAt
  }
}

export class SqliteIngredientsRepository implements IngredientsRepository {
  constructor(private readonly db: Db) {}

  private async currentPrice(ingredientId: string): Promise<IngredientPrice | null> {
    // Two inserts in the same millisecond get an identical `createdAt`; the
    // rowid tiebreaker keeps "current price" deterministic (last inserted
    // wins) instead of depending on SQLite's unspecified tie ordering.
    const [row] = await this.db
      .select()
      .from(schema.ingredientPrices)
      .where(eq(schema.ingredientPrices.ingredientId, ingredientId))
      .orderBy(desc(schema.ingredientPrices.createdAt), desc(sql`rowid`))
      .limit(1)
    return row ? toIngredientPrice(row) : null
  }

  async list(): Promise<IngredientWithPrice[]> {
    const rows = await this.db.select().from(schema.ingredients).orderBy(asc(schema.ingredients.name))
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        currentPrice: await this.currentPrice(row.id)
      }))
    )
  }

  async getById(id: string): Promise<IngredientWithPrice | null> {
    const [row] = await this.db.select().from(schema.ingredients).where(eq(schema.ingredients.id, id))
    if (!row) return null
    return { ...row, currentPrice: await this.currentPrice(id) }
  }

  async create(input: CreateIngredientInput): Promise<IngredientWithPrice> {
    const id = randomUUID()
    const timestamp = now()
    await this.db.insert(schema.ingredients).values({
      id,
      name: input.name,
      unit: input.unit,
      icon: input.icon,
      createdAt: timestamp,
      updatedAt: timestamp
    })
    if (input.initialPrice !== undefined) {
      await this.addPrice({ ingredientId: id, price: input.initialPrice, currency: 'EUR' })
    }
    const created = await this.getById(id)
    if (!created) throw new Error('Failed to create ingredient')
    return created
  }

  async update(input: UpdateIngredientInput): Promise<IngredientWithPrice> {
    const patch: Partial<typeof schema.ingredients.$inferInsert> = { updatedAt: now() }
    if (input.name !== undefined) patch.name = input.name
    if (input.unit !== undefined) patch.unit = input.unit
    if (input.icon !== undefined) patch.icon = input.icon

    await this.db.update(schema.ingredients).set(patch).where(eq(schema.ingredients.id, input.id))
    const updated = await this.getById(input.id)
    if (!updated) throw new Error(`Ingredient ${input.id} not found`)
    return updated
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(schema.ingredients).where(eq(schema.ingredients.id, id))
  }

  async addPrice(input: AddIngredientPriceInput): Promise<IngredientPrice> {
    const id = randomUUID()
    const row = {
      id,
      ingredientId: input.ingredientId,
      price: input.price,
      currency: input.currency,
      createdAt: now()
    }
    // Prices are append-only: this always INSERTs, never UPDATEs, so the
    // full price history is preserved.
    await this.db.insert(schema.ingredientPrices).values(row)
    await this.db
      .update(schema.ingredients)
      .set({ updatedAt: now() })
      .where(eq(schema.ingredients.id, input.ingredientId))
    return toIngredientPrice(row as typeof schema.ingredientPrices.$inferSelect)
  }

  async listPriceHistory(ingredientId: string): Promise<IngredientPrice[]> {
    const rows = await this.db
      .select()
      .from(schema.ingredientPrices)
      .where(eq(schema.ingredientPrices.ingredientId, ingredientId))
      .orderBy(desc(schema.ingredientPrices.createdAt), desc(sql`rowid`))
    return rows.map(toIngredientPrice)
  }
}

function toRecipeIngredient(row: typeof schema.recipeIngredients.$inferSelect): RecipeIngredient {
  return {
    id: row.id,
    recipeId: row.recipeId,
    ingredientId: row.ingredientId,
    quantityPerPerson: row.quantityPerPerson,
    position: row.position
  }
}

function toRecipe(row: typeof schema.recipes.$inferSelect): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: (row.description ?? EMPTY_BLOCKNOTE_DOCUMENT) as Recipe['description'],
    steps: (row.steps ?? EMPTY_BLOCKNOTE_DOCUMENT) as Recipe['steps'],
    imagePath: row.imagePath,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export class SqliteRecipesRepository implements RecipesRepository {
  constructor(private readonly db: Db) {}

  async list(): Promise<Recipe[]> {
    const rows = await this.db.select().from(schema.recipes).orderBy(asc(schema.recipes.name))
    return rows.map(toRecipe)
  }

  async getById(id: string): Promise<RecipeWithIngredients | null> {
    const [row] = await this.db.select().from(schema.recipes).where(eq(schema.recipes.id, id))
    if (!row) return null
    const ingredientRows = await this.db
      .select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, id))
      .orderBy(asc(schema.recipeIngredients.position))
    return { ...toRecipe(row), ingredients: ingredientRows.map(toRecipeIngredient) }
  }

  async create(input: CreateRecipeInput): Promise<Recipe> {
    const id = randomUUID()
    const timestamp = now()
    const row = {
      id,
      name: input.name,
      description: EMPTY_BLOCKNOTE_DOCUMENT,
      steps: EMPTY_BLOCKNOTE_DOCUMENT,
      imagePath: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    await this.db.insert(schema.recipes).values(row)
    return toRecipe(row as typeof schema.recipes.$inferSelect)
  }

  async update(input: UpdateRecipeInput): Promise<Recipe> {
    const patch: Partial<typeof schema.recipes.$inferInsert> = { updatedAt: now() }
    if (input.name !== undefined) patch.name = input.name
    if (input.description !== undefined) patch.description = input.description
    if (input.steps !== undefined) patch.steps = input.steps
    if (input.imagePath !== undefined) patch.imagePath = input.imagePath

    await this.db.update(schema.recipes).set(patch).where(eq(schema.recipes.id, input.id))
    const [updated] = await this.db.select().from(schema.recipes).where(eq(schema.recipes.id, input.id))
    if (!updated) throw new Error(`Recipe ${input.id} not found`)
    return toRecipe(updated)
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(schema.recipes).where(eq(schema.recipes.id, id))
  }

  async addIngredient(input: AddRecipeIngredientInput): Promise<RecipeIngredient> {
    let position = input.position
    if (position === undefined) {
      const existing = await this.db
        .select()
        .from(schema.recipeIngredients)
        .where(eq(schema.recipeIngredients.recipeId, input.recipeId))
      position = existing.length
    }
    const row = {
      id: randomUUID(),
      recipeId: input.recipeId,
      ingredientId: input.ingredientId,
      quantityPerPerson: input.quantityPerPerson,
      position
    }
    await this.db.insert(schema.recipeIngredients).values(row)
    await this.db
      .update(schema.recipes)
      .set({ updatedAt: now() })
      .where(eq(schema.recipes.id, input.recipeId))
    return toRecipeIngredient(row as typeof schema.recipeIngredients.$inferSelect)
  }

  async updateIngredient(input: UpdateRecipeIngredientInput): Promise<RecipeIngredient> {
    const patch: Partial<typeof schema.recipeIngredients.$inferInsert> = {}
    if (input.ingredientId !== undefined) patch.ingredientId = input.ingredientId
    if (input.quantityPerPerson !== undefined) patch.quantityPerPerson = input.quantityPerPerson

    await this.db
      .update(schema.recipeIngredients)
      .set(patch)
      .where(eq(schema.recipeIngredients.id, input.id))
    const [updated] = await this.db
      .select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.id, input.id))
    if (!updated) throw new Error(`Recipe ingredient ${input.id} not found`)
    return toRecipeIngredient(updated)
  }

  async removeIngredient(id: string): Promise<void> {
    await this.db.delete(schema.recipeIngredients).where(eq(schema.recipeIngredients.id, id))
  }

  async reorderIngredients(input: ReorderRecipeIngredientsInput): Promise<void> {
    await Promise.all(
      input.orderedIds.map((id, position) =>
        this.db
          .update(schema.recipeIngredients)
          .set({ position })
          .where(
            and(
              eq(schema.recipeIngredients.id, id),
              eq(schema.recipeIngredients.recipeId, input.recipeId)
            )
          )
      )
    )
  }
}
