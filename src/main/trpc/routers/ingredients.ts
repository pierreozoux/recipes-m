import { z } from 'zod'
import {
  addIngredientPriceInputSchema,
  createIngredientInputSchema,
  idInputSchema,
  ingredientPriceSchema,
  ingredientWithPriceSchema,
  updateIngredientInputSchema
} from '@shared/schemas/ingredient'
import { publicProcedure, requireDb, router } from '../context'

export const ingredientsRouter = router({
  list: publicProcedure.output(z.array(ingredientWithPriceSchema)).query(({ ctx }) => {
    return requireDb(ctx).ingredients.list()
  }),

  getById: publicProcedure
    .input(idInputSchema)
    .output(ingredientWithPriceSchema.nullable())
    .query(({ ctx, input }) => {
      return requireDb(ctx).ingredients.getById(input.id)
    }),

  create: publicProcedure
    .input(createIngredientInputSchema)
    .output(ingredientWithPriceSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).ingredients.create(input)
    }),

  update: publicProcedure
    .input(updateIngredientInputSchema)
    .output(ingredientWithPriceSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).ingredients.update(input)
    }),

  remove: publicProcedure.input(idInputSchema).mutation(({ ctx, input }) => {
    return requireDb(ctx).ingredients.remove(input.id)
  }),

  addPrice: publicProcedure
    .input(addIngredientPriceInputSchema)
    .output(ingredientPriceSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).ingredients.addPrice(input)
    }),

  listPriceHistory: publicProcedure
    .input(z.object({ ingredientId: z.string().min(1) }))
    .output(z.array(ingredientPriceSchema))
    .query(({ ctx, input }) => {
      return requireDb(ctx).ingredients.listPriceHistory(input.ingredientId)
    })
})
