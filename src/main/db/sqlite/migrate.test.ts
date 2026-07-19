import Database from 'better-sqlite3'
import { describe, expect, it, vi } from 'vitest'
import { runMigrations } from './migrate'

describe('runMigrations', () => {
  it('applies migrations and tracks them in _migrations', () => {
    const db = new Database(':memory:')
    runMigrations(db)

    const applied = db.prepare('SELECT name FROM _migrations').all()
    expect(applied.length).toBeGreaterThan(0)

    // re-running is a no-op, not a re-apply
    runMigrations(db)
    expect(db.prepare('SELECT name FROM _migrations').all()).toEqual(applied)

    db.close()
  })

  it('falls back to a rollback journal when WAL mode is unavailable', () => {
    // WAL requires shared-memory (mmap) locking that network drives and
    // cloud-synced folders (OneDrive, Dropbox) refuse to provide — this is
    // the Windows "couldn't open this folder" bug: the workspace directory
    // gets created but the database never finishes opening.
    const db = new Database(':memory:')
    const pragma = vi.spyOn(db, 'pragma')
    pragma.mockImplementationOnce(() => {
      throw new Error('SQLITE_IOERR: disk I/O error')
    })

    expect(() => runMigrations(db)).not.toThrow()
    expect(pragma).toHaveBeenCalledWith('journal_mode = WAL')
    expect(pragma).toHaveBeenCalledWith('journal_mode = DELETE')

    const applied = db.prepare('SELECT name FROM _migrations').all()
    expect(applied.length).toBeGreaterThan(0)

    db.close()
  })
})
