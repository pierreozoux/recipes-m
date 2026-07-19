import { dialog } from 'electron'
import { z } from 'zod'
import { workspaceInfoSchema, recentWorkspaceSchema } from '@shared/schemas/common'
import { publicProcedure, router } from '../context'
import { isLikelyWorkspaceFolder, listRecentWorkspaces } from '../../workspace/workspace'

export const workspaceRouter = router({
  current: publicProcedure.output(workspaceInfoSchema.nullable()).query(({ ctx }) => {
    return ctx.workspace.activeInfo
  }),

  recents: publicProcedure.output(z.array(recentWorkspaceSchema)).query(() => {
    return listRecentWorkspaces()
  }),

  pickFolder: publicProcedure
    .input(z.object({ mode: z.enum(['open', 'create']) }))
    .output(z.string().nullable())
    .mutation(async ({ ctx, input }) => {
      const window = ctx.getMainWindow()
      const properties: Array<'openDirectory' | 'createDirectory' | 'promptToCreate'> =
        input.mode === 'create'
          ? ['openDirectory', 'createDirectory', 'promptToCreate']
          : ['openDirectory']
      const result = window
        ? await dialog.showOpenDialog(window, { properties })
        : await dialog.showOpenDialog({ properties })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    }),

  isWorkspaceFolder: publicProcedure
    .input(z.object({ path: z.string() }))
    .output(z.boolean())
    .query(({ input }) => isLikelyWorkspaceFolder(input.path)),

  open: publicProcedure
    .input(z.object({ path: z.string().min(1) }))
    .output(workspaceInfoSchema)
    .mutation(({ ctx, input }) => {
      return ctx.workspace.open(input.path)
    })
})
