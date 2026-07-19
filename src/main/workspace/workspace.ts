import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { app } from 'electron'
import type { DbClient } from '../db/client'
import { createSqliteDbClient } from '../db/sqlite'
import type { RecentWorkspace, WorkspaceInfo } from '@shared/schemas/common'

const DB_FILE_NAME = 'recipes.sqlite'
const IMAGES_DIR_NAME = 'images'
const MAX_RECENTS = 8

interface ConfigFile {
  recentWorkspaces: RecentWorkspace[]
}

function configFilePath(): string {
  return join(app.getPath('userData'), 'recipes-m-config.json')
}

// A hand-rolled JSON store instead of electron-store: electron-store (and
// its `conf` dependency) ship ESM-only, which can't be `require()`d from
// the CJS main bundle electron-trpc forces us into (see
// electron.vite.config.ts). This tiny reader/writer avoids that entirely.
function readConfig(): ConfigFile {
  try {
    const raw = readFileSync(configFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ConfigFile>
    return { recentWorkspaces: parsed.recentWorkspaces ?? [] }
  } catch {
    return { recentWorkspaces: [] }
  }
}

function writeConfig(config: ConfigFile): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(configFilePath(), JSON.stringify(config, null, 2))
}

export function imagesDirFor(workspacePath: string): string {
  return join(workspacePath, IMAGES_DIR_NAME)
}

function databaseFileFor(workspacePath: string): string {
  return join(workspacePath, DB_FILE_NAME)
}

export function isLikelyWorkspaceFolder(path: string): boolean {
  return existsSync(databaseFileFor(path))
}

function rememberRecent(path: string): void {
  const config = readConfig()
  const next: RecentWorkspace[] = [
    { path, name: basename(path), lastOpenedAt: new Date().toISOString() },
    ...config.recentWorkspaces.filter((w) => w.path !== path)
  ].slice(0, MAX_RECENTS)
  writeConfig({ recentWorkspaces: next })
}

export function listRecentWorkspaces(): RecentWorkspace[] {
  return readConfig().recentWorkspaces
}

/**
 * A "recipe folder" is any directory containing (or about to contain)
 * `recipes.sqlite` + an `images/` subfolder. Opening an existing folder and
 * creating a new one are the same operation: ensure the structure exists,
 * then open the database. The renderer's Open/Create screen only differs in
 * which native dialog it triggers beforehand.
 */
export class WorkspaceManager {
  private current: { info: WorkspaceInfo; db: DbClient } | null = null

  get activeDb(): DbClient {
    if (!this.current) throw new Error('No workspace is open yet')
    return this.current.db
  }

  get activeInfo(): WorkspaceInfo | null {
    return this.current?.info ?? null
  }

  open(path: string): WorkspaceInfo {
    if (this.current && this.current.info.path !== path) {
      this.current.db.close()
      this.current = null
    }

    mkdirSync(imagesDirFor(path), { recursive: true })
    const db = createSqliteDbClient(databaseFileFor(path))
    const info: WorkspaceInfo = { path, name: basename(path) }
    this.current = { info, db }
    rememberRecent(path)
    return info
  }

  close(): void {
    this.current?.db.close()
    this.current = null
  }
}
