import { z } from 'zod'

export const ingredientUnitSchema = z.enum(['kg', 'l'])
export type IngredientUnit = z.infer<typeof ingredientUnitSchema>

export const DEFAULT_INGREDIENT_ICON = '🥕'

export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  unit: ingredientUnitSchema,
  icon: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string()
})
export type Ingredient = z.infer<typeof ingredientSchema>

export const ingredientPriceSchema = z.object({
  id: z.string(),
  ingredientId: z.string(),
  price: z.number().nonnegative(),
  currency: z.string().min(1),
  createdAt: z.string()
})
export type IngredientPrice = z.infer<typeof ingredientPriceSchema>

export const ingredientWithPriceSchema = ingredientSchema.extend({
  currentPrice: ingredientPriceSchema.nullable()
})
export type IngredientWithPrice = z.infer<typeof ingredientWithPriceSchema>

/** The subset of fields the AutoForm renders on the ingredient edit screen. */
export const ingredientEditableFieldsSchema = ingredientSchema.pick({
  name: true,
  unit: true,
  icon: true
})
export type IngredientEditableFields = z.infer<typeof ingredientEditableFieldsSchema>

export const createIngredientInputSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  unit: ingredientUnitSchema.default('kg'),
  icon: z.string().min(1).default(DEFAULT_INGREDIENT_ICON),
  initialPrice: z.number().nonnegative().optional()
})
export type CreateIngredientInput = z.infer<typeof createIngredientInputSchema>

export const updateIngredientInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'validation.required').optional(),
  unit: ingredientUnitSchema.optional(),
  icon: z.string().min(1).optional()
})
export type UpdateIngredientInput = z.infer<typeof updateIngredientInputSchema>

export const addIngredientPriceInputSchema = z.object({
  ingredientId: z.string().min(1),
  price: z.number().nonnegative(),
  currency: z.string().min(1).default('EUR')
})
export type AddIngredientPriceInput = z.infer<typeof addIngredientPriceInputSchema>

export const idInputSchema = z.object({ id: z.string().min(1) })
