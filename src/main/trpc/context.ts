import { initTRPC, TRPCError } from '@trpc/server'
import type { BrowserWindow } from 'electron'
import type { DbClient } from '../db/client'
import type { WorkspaceManager } from '../workspace/workspace'

export interface TrpcContext {
  workspace: WorkspaceManager
  getMainWindow: () => BrowserWindow | null
}

const t = initTRPC.context<TrpcContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export function requireDb(ctx: TrpcContext): DbClient {
  try {
    return ctx.workspace.activeDb
  } catch {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'No recipe folder is open yet' })
  }
}
