import { describe, expect, it } from 'vitest'
import {
  addRecipeIngredientInputSchema,
  createRecipeInputSchema,
  reorderRecipeIngredientsInputSchema,
  updateRecipeInputSchema
} from './recipe'

describe('createRecipeInputSchema', () => {
  it('rejects an empty name', () => {
    expect(createRecipeInputSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('accepts a non-empty name', () => {
    expect(createRecipeInputSchema.safeParse({ name: 'Pancakes' }).success).toBe(true)
  })
})

describe('updateRecipeInputSchema', () => {
  it('accepts a BlockNote-shaped document for description/steps', () => {
    const result = updateRecipeInputSchema.safeParse({
      id: 'r1',
      description: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }]
    })
    expect(result.success).toBe(true)
  })

  it('accepts null to clear the image path', () => {
    expect(updateRecipeInputSchema.safeParse({ id: 'r1', imagePath: null }).success).toBe(true)
  })
})

describe('addRecipeIngredientInputSchema', () => {
  it('defaults quantityPerPerson to 0 when omitted', () => {
    const result = addRecipeIngredientInputSchema.parse({ recipeId: 'r1', ingredientId: 'i1' })
    expect(result.quantityPerPerson).toBe(0)
  })

  it('rejects a negative quantity', () => {
    const result = addRecipeIngredientInputSchema.safeParse({
      recipeId: 'r1',
      ingredientId: 'i1',
      quantityPerPerson: -2
    })
    expect(result.success).toBe(false)
  })
})

describe('reorderRecipeIngredientsInputSchema', () => {
  it('accepts an ordered list of ids', () => {
    const result = reorderRecipeIngredientsInputSchema.safeParse({
      recipeId: 'r1',
      orderedIds: ['a', 'b', 'c']
    })
    expect(result.success).toBe(true)
  })
})
