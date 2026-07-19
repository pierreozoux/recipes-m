import { randomUUID } from 'node:crypto'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  addRecipeIngredientInputSchema,
  createRecipeInputSchema,
  idInputSchema,
  recipeIngredientSchema,
  recipeSchema,
  recipeWithIngredientsSchema,
  removeRecipeIngredientInputSchema,
  reorderRecipeIngredientsInputSchema,
  setRecipeImageInputSchema,
  updateRecipeIngredientInputSchema,
  updateRecipeInputSchema
} from '@shared/schemas/recipe'
import { publicProcedure, requireDb, router } from '../context'
import { imagesDirFor } from '../../workspace/workspace'

const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

const MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
}

export const recipesRouter = router({
  list: publicProcedure.output(z.array(recipeSchema)).query(({ ctx }) => {
    return requireDb(ctx).recipes.list()
  }),

  getById: publicProcedure
    .input(idInputSchema)
    .output(recipeWithIngredientsSchema.nullable())
    .query(({ ctx, input }) => {
      return requireDb(ctx).recipes.getById(input.id)
    }),

  create: publicProcedure
    .input(createRecipeInputSchema)
    .output(recipeSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).recipes.create(input)
    }),

  getImageDataUrl: publicProcedure
    .input(idInputSchema)
    .output(z.string().nullable())
    .query(async ({ ctx, input }) => {
      const info = ctx.workspace.activeInfo
      const db = requireDb(ctx)
      if (!info) return null
      const recipe = await db.recipes.getById(input.id)
      if (!recipe?.imagePath) return null
      const ext = extname(recipe.imagePath).toLowerCase()
      const buffer = await readFile(join(imagesDirFor(info.path), recipe.imagePath)).catch(() => null)
      if (!buffer) return null
      const mime = MIME_BY_EXTENSION[ext] ?? 'application/octet-stream'
      return `data:${mime};base64,${buffer.toString('base64')}`
    }),

  update: publicProcedure
    .input(updateRecipeInputSchema)
    .output(recipeSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).recipes.update(input)
    }),

  remove: publicProcedure.input(idInputSchema).mutation(({ ctx, input }) => {
    return requireDb(ctx).recipes.remove(input.id)
  }),

  addIngredient: publicProcedure
    .input(addRecipeIngredientInputSchema)
    .output(recipeIngredientSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).recipes.addIngredient(input)
    }),

  updateIngredient: publicProcedure
    .input(updateRecipeIngredientInputSchema)
    .output(recipeIngredientSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).recipes.updateIngredient(input)
    }),

  removeIngredient: publicProcedure.input(removeRecipeIngredientInputSchema).mutation(({ ctx, input }) => {
    return requireDb(ctx).recipes.removeIngredient(input.id)
  }),

  reorderIngredients: publicProcedure
    .input(reorderRecipeIngredientsInputSchema)
    .mutation(({ ctx, input }) => {
      return requireDb(ctx).recipes.reorderIngredients(input)
    }),

  setImage: publicProcedure
    .input(setRecipeImageInputSchema)
    .output(recipeSchema)
    .mutation(async ({ ctx, input }) => {
      const info = ctx.workspace.activeInfo
      if (!info) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'No recipe folder is open yet' })

      const ext = extname(input.fileName).toLowerCase()
      if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unsupported image type: ${ext}` })
      }

      const buffer = Buffer.from(input.dataBase64, 'base64')
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Image is too large (max 15MB)' })
      }

      const db = requireDb(ctx)
      const existing = await db.recipes.getById(input.recipeId)
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipe not found' })

      const storedFileName = `${input.recipeId}-${randomUUID()}${ext}`
      await writeFile(join(imagesDirFor(info.path), storedFileName), buffer)

      if (existing.imagePath) {
        await unlink(join(imagesDirFor(info.path), existing.imagePath)).catch(() => undefined)
      }

      return db.recipes.update({ id: input.recipeId, imagePath: storedFileName })
    })
})
