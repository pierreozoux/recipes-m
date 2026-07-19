import { router } from './context'
import { ingredientsRouter } from './routers/ingredients'
import { recipesRouter } from './routers/recipes'
import { workspaceRouter } from './routers/workspace'

export const appRouter = router({
  workspace: workspaceRouter,
  ingredients: ingredientsRouter,
  recipes: recipesRouter
})

export type AppRouter = typeof appRouter
