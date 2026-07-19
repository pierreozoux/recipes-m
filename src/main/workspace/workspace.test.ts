import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => join(tmpdir(), 'recipes-m-test-userdata') }
}))

const { WorkspaceManager, imagesDirFor } = await import('./workspace')

describe('WorkspaceManager.open', () => {
  let root: string
  let manager: InstanceType<typeof WorkspaceManager>

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'recipes-m-workspace-'))
    manager = new WorkspaceManager()
  })

  afterEach(() => {
    manager.close()
    rmSync(root, { recursive: true, force: true })
  })

  it('creates the images folder AND the sqlite database when opening a brand-new folder', () => {
    const workspacePath = join(root, 'My Recipes')

    manager.open(workspacePath)

    expect(existsSync(imagesDirFor(workspacePath))).toBe(true)
    expect(existsSync(join(workspacePath, 'recipes.sqlite'))).toBe(true)
  })

  it('still creates the database if the workspace directory does not exist yet', () => {
    // Windows' "promptToCreate" open-dialog option returns a path the user
    // typed without actually creating it on disk — the app must create the
    // whole tree itself, not just assume the parent exists.
    const workspacePath = join(root, 'nested', 'New Folder')

    manager.open(workspacePath)

    expect(existsSync(imagesDirFor(workspacePath))).toBe(true)
    expect(existsSync(join(workspacePath, 'recipes.sqlite'))).toBe(true)
  })
})
