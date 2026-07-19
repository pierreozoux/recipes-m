import { describe, expect, it } from 'vitest'
import {
  addIngredientPriceInputSchema,
  createIngredientInputSchema,
  updateIngredientInputSchema
} from './ingredient'

describe('createIngredientInputSchema', () => {
  it('rejects an empty name', () => {
    const result = createIngredientInputSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid unit', () => {
    const result = createIngredientInputSchema.safeParse({ name: 'Flour', unit: 'grams' })
    expect(result.success).toBe(false)
  })

  it('defaults unit to kg and icon to a carrot when omitted', () => {
    const result = createIngredientInputSchema.parse({ name: 'Flour' })
    expect(result.unit).toBe('kg')
    expect(result.icon).toBeTruthy()
  })

  it('accepts a valid payload with an initial price', () => {
    const result = createIngredientInputSchema.safeParse({
      name: 'Olive oil',
      unit: 'l',
      icon: '🫒',
      initialPrice: 8.5
    })
    expect(result.success).toBe(true)
  })

  it('rejects a negative initial price', () => {
    const result = createIngredientInputSchema.safeParse({ name: 'Oil', initialPrice: -1 })
    expect(result.success).toBe(false)
  })
})

describe('updateIngredientInputSchema', () => {
  it('requires an id but allows all other fields to be omitted (partial patch)', () => {
    const result = updateIngredientInputSchema.safeParse({ id: 'abc' })
    expect(result.success).toBe(true)
  })

  it('rejects a missing id', () => {
    const result = updateIngredientInputSchema.safeParse({ name: 'Flour' })
    expect(result.success).toBe(false)
  })
})

describe('addIngredientPriceInputSchema', () => {
  it('rejects a negative price', () => {
    const result = addIngredientPriceInputSchema.safeParse({ ingredientId: 'abc', price: -5 })
    expect(result.success).toBe(false)
  })

  it('accepts zero as a valid price', () => {
    const result = addIngredientPriceInputSchema.safeParse({ ingredientId: 'abc', price: 0 })
    expect(result.success).toBe(true)
  })
})
