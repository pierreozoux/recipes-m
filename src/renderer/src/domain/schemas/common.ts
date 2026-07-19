import { z } from 'zod'

export const idSchema = z.string().min(1)
export const isoDateTimeSchema = z.string()

export const recentWorkspaceSchema = z.object({
  path: z.string(),
  name: z.string(),
  lastOpenedAt: z.string()
})
export type RecentWorkspace = z.infer<typeof recentWorkspaceSchema>

export const workspaceInfoSchema = z.object({
  path: z.string(),
  name: z.string()
})
export type WorkspaceInfo = z.infer<typeof workspaceInfoSchema>
