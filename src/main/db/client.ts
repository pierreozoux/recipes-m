import type {
  AddIngredientPriceInput,
  CreateIngredientInput,
  Ingredient,
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

export interface IngredientsRepository {
  list(): Promise<IngredientWithPrice[]>
  getById(id: string): Promise<IngredientWithPrice | null>
  create(input: CreateIngredientInput): Promise<IngredientWithPrice>
  update(input: UpdateIngredientInput): Promise<IngredientWithPrice>
  remove(id: string): Promise<void>
  addPrice(input: AddIngredientPriceInput): Promise<IngredientPrice>
  listPriceHistory(ingredientId: string): Promise<IngredientPrice[]>
}

export interface RecipesRepository {
  list(): Promise<Recipe[]>
  getById(id: string): Promise<RecipeWithIngredients | null>
  create(input: CreateRecipeInput): Promise<Recipe>
  update(input: UpdateRecipeInput): Promise<Recipe>
  remove(id: string): Promise<void>
  addIngredient(input: AddRecipeIngredientInput): Promise<RecipeIngredient>
  updateIngredient(input: UpdateRecipeIngredientInput): Promise<RecipeIngredient>
  removeIngredient(id: string): Promise<void>
  reorderIngredients(input: ReorderRecipeIngredientsInput): Promise<void>
}

/**
 * The application only ever depends on this interface, never on Drizzle or
 * better-sqlite3 directly. Swapping to Postgres later means adding a
 * `db/postgres` implementation of `DbClient` — nothing above this layer
 * (tRPC routers, renderer) needs to change.
 */
export interface DbClient {
  ingredients: IngredientsRepository
  recipes: RecipesRepository
  close(): void
}

export type { Ingredient, Recipe }
