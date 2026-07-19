import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { OpenApiGeneratorV31, OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import {
  addIngredientPriceInputSchema,
  createIngredientInputSchema,
  idInputSchema as ingredientIdInputSchema,
  ingredientPriceSchema,
  ingredientWithPriceSchema,
  updateIngredientInputSchema
} from '../src/renderer/src/domain/schemas/ingredient'
import {
  addRecipeIngredientInputSchema,
  createRecipeInputSchema,
  idInputSchema as recipeIdInputSchema,
  recipeIngredientSchema,
  recipeSchema,
  recipeWithIngredientsSchema,
  updateRecipeIngredientInputSchema,
  updateRecipeInputSchema
} from '../src/renderer/src/domain/schemas/recipe'

// Patches ZodType.prototype with `.openapi()`. Our domain schemas (the
// single source of truth, shared with the DB layer and tRPC validation)
// never call `.openapi()` themselves, so this is purely additive and can
// run right before we start registering them below.
extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

const jsonBody = <T extends z.ZodTypeAny>(schema: T): { content: { 'application/json': { schema: T } } } => ({
  content: { 'application/json': { schema } }
})

const Ingredient = registry.register('Ingredient', ingredientWithPriceSchema)
const IngredientPrice = registry.register('IngredientPrice', ingredientPriceSchema)
const Recipe = registry.register('Recipe', recipeSchema)
const RecipeWithIngredients = registry.register('RecipeWithIngredients', recipeWithIngredientsSchema)
const RecipeIngredient = registry.register('RecipeIngredient', recipeIngredientSchema)

registry.registerPath({
  method: 'get',
  path: '/ingredients',
  tags: ['Ingredients'],
  summary: 'List all ingredients with their current price',
  responses: { 200: { description: 'OK', ...jsonBody(z.array(Ingredient)) } }
})

registry.registerPath({
  method: 'post',
  path: '/ingredients',
  tags: ['Ingredients'],
  summary: 'Create an ingredient',
  request: { body: jsonBody(createIngredientInputSchema) },
  responses: { 200: { description: 'Created', ...jsonBody(Ingredient) } }
})

registry.registerPath({
  method: 'get',
  path: '/ingredients/{id}',
  tags: ['Ingredients'],
  summary: 'Get an ingredient by id',
  request: { params: ingredientIdInputSchema },
  responses: { 200: { description: 'OK', ...jsonBody(Ingredient.nullable()) } }
})

registry.registerPath({
  method: 'patch',
  path: '/ingredients/{id}',
  tags: ['Ingredients'],
  summary: 'Update an ingredient (name, unit, icon)',
  request: { params: ingredientIdInputSchema, body: jsonBody(updateIngredientInputSchema) },
  responses: { 200: { description: 'OK', ...jsonBody(Ingredient) } }
})

registry.registerPath({
  method: 'delete',
  path: '/ingredients/{id}',
  tags: ['Ingredients'],
  summary: 'Delete an ingredient',
  request: { params: ingredientIdInputSchema },
  responses: { 204: { description: 'Deleted' } }
})

registry.registerPath({
  method: 'post',
  path: '/ingredients/{id}/prices',
  tags: ['Ingredients'],
  summary: 'Append a new price to an ingredient (full price history is preserved, never overwritten)',
  request: { params: ingredientIdInputSchema, body: jsonBody(addIngredientPriceInputSchema) },
  responses: { 200: { description: 'Created', ...jsonBody(IngredientPrice) } }
})

registry.registerPath({
  method: 'get',
  path: '/ingredients/{id}/prices',
  tags: ['Ingredients'],
  summary: 'List the full price history of an ingredient, newest first',
  request: { params: ingredientIdInputSchema },
  responses: { 200: { description: 'OK', ...jsonBody(z.array(IngredientPrice)) } }
})

registry.registerPath({
  method: 'get',
  path: '/recipes',
  tags: ['Recipes'],
  summary: 'List all recipes',
  responses: { 200: { description: 'OK', ...jsonBody(z.array(Recipe)) } }
})

registry.registerPath({
  method: 'post',
  path: '/recipes',
  tags: ['Recipes'],
  summary: 'Create a recipe',
  request: { body: jsonBody(createRecipeInputSchema) },
  responses: { 200: { description: 'Created', ...jsonBody(Recipe) } }
})

registry.registerPath({
  method: 'get',
  path: '/recipes/{id}',
  tags: ['Recipes'],
  summary: 'Get a recipe with its ingredient list, by id',
  request: { params: recipeIdInputSchema },
  responses: { 200: { description: 'OK', ...jsonBody(RecipeWithIngredients.nullable()) } }
})

registry.registerPath({
  method: 'patch',
  path: '/recipes/{id}',
  tags: ['Recipes'],
  summary: 'Update a recipe (name, description, steps, image path)',
  request: { params: recipeIdInputSchema, body: jsonBody(updateRecipeInputSchema) },
  responses: { 200: { description: 'OK', ...jsonBody(Recipe) } }
})

registry.registerPath({
  method: 'delete',
  path: '/recipes/{id}',
  tags: ['Recipes'],
  summary: 'Delete a recipe',
  request: { params: recipeIdInputSchema },
  responses: { 204: { description: 'Deleted' } }
})

registry.registerPath({
  method: 'post',
  path: '/recipes/{id}/ingredients',
  tags: ['Recipes'],
  summary: 'Add an ingredient row to a recipe',
  request: { params: recipeIdInputSchema, body: jsonBody(addRecipeIngredientInputSchema) },
  responses: { 200: { description: 'Created', ...jsonBody(RecipeIngredient) } }
})

registry.registerPath({
  method: 'patch',
  path: '/recipe-ingredients/{id}',
  tags: ['Recipes'],
  summary: 'Update a recipe ingredient row (quantity per person, or swap ingredient)',
  request: { body: jsonBody(updateRecipeIngredientInputSchema) },
  responses: { 200: { description: 'OK', ...jsonBody(RecipeIngredient) } }
})

registry.registerPath({
  method: 'delete',
  path: '/recipe-ingredients/{id}',
  tags: ['Recipes'],
  summary: 'Remove an ingredient row from a recipe',
  responses: { 204: { description: 'Deleted' } }
})

const generator = new OpenApiGeneratorV31(registry.definitions)
const document = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'recipes-m API',
    version: '0.1.0',
    description:
      'API surface of the recipes-m back office, generated from the Zod schemas that are the single ' +
      'source of truth for validation, the database layer, and the auto-generated UI forms. Today this ' +
      'API is exposed over Electron IPC via tRPC (see src/main/trpc); this document exists to prove the ' +
      'data model is API-describable and to serve as a stable contract if the app grows an HTTP transport.'
  }
})

const outPath = resolve(import.meta.dirname, '../openapi.json')
writeFileSync(outPath, JSON.stringify(document, null, 2))
console.log(`OpenAPI spec written to ${outPath}`)
