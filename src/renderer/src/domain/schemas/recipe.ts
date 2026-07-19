import { z } from 'zod'

/**
 * BlockNote persists a document as an array of block objects. We don't
 * constrain the internal shape here (that's BlockNote's contract) so the
 * schema doesn't need to change every time BlockNote adds a block type.
 */
export const blockNoteDocumentSchema = z.array(z.record(z.string(), z.unknown()))
export type BlockNoteDocument = z.infer<typeof blockNoteDocumentSchema>

export const EMPTY_BLOCKNOTE_DOCUMENT: BlockNoteDocument = []

export const recipeIngredientSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  ingredientId: z.string(),
  quantityPerPerson: z.number().nonnegative(),
  position: z.number().int().nonnegative()
})
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: blockNoteDocumentSchema,
  steps: blockNoteDocumentSchema,
  imagePath: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
})
export type Recipe = z.infer<typeof recipeSchema>

export const recipeWithIngredientsSchema = recipeSchema.extend({
  ingredients: z.array(recipeIngredientSchema)
})
export type RecipeWithIngredients = z.infer<typeof recipeWithIngredientsSchema>

/** The subset of fields the AutoForm renders on the recipe edit screen (image and ingredients are separate sections). */
export const recipeEditableFieldsSchema = recipeSchema.pick({
  name: true,
  description: true,
  steps: true
})
export type RecipeEditableFields = z.infer<typeof recipeEditableFieldsSchema>

export const createRecipeInputSchema = z.object({
  name: z.string().min(1, 'validation.required')
})
export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>

export const updateRecipeInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'validation.required').optional(),
  description: blockNoteDocumentSchema.optional(),
  steps: blockNoteDocumentSchema.optional(),
  imagePath: z.string().nullable().optional()
})
export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>

export const addRecipeIngredientInputSchema = z.object({
  recipeId: z.string().min(1),
  ingredientId: z.string().min(1),
  quantityPerPerson: z.number().nonnegative().default(0),
  position: z.number().int().nonnegative().optional()
})
export type AddRecipeIngredientInput = z.infer<typeof addRecipeIngredientInputSchema>

export const updateRecipeIngredientInputSchema = z.object({
  id: z.string().min(1),
  ingredientId: z.string().min(1).optional(),
  quantityPerPerson: z.number().nonnegative().optional()
})
export type UpdateRecipeIngredientInput = z.infer<typeof updateRecipeIngredientInputSchema>

export const removeRecipeIngredientInputSchema = z.object({ id: z.string().min(1) })
export type RemoveRecipeIngredientInput = z.infer<typeof removeRecipeIngredientInputSchema>

export const reorderRecipeIngredientsInputSchema = z.object({
  recipeId: z.string().min(1),
  orderedIds: z.array(z.string().min(1))
})
export type ReorderRecipeIngredientsInput = z.infer<typeof reorderRecipeIngredientsInputSchema>

export const setRecipeImageInputSchema = z.object({
  recipeId: z.string().min(1),
  fileName: z.string().min(1),
  dataBase64: z.string().min(1)
})
export type SetRecipeImageInput = z.infer<typeof setRecipeImageInputSchema>

export const idInputSchema = z.object({ id: z.string().min(1) })
