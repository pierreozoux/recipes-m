import type Database from 'better-sqlite3'
import { migrations } from '../migrations'

/**
 * Minimal, dependency-free migration runner. We don't use
 * drizzle-orm's file-based migrator because it expects a loose
 * migrations folder + meta journal on disk at runtime, which is awkward
 * to guarantee inside a packaged Electron app. Instead the SQL is bundled
 * into the main process at build time (see migrations/index.ts) and applied
 * here, tracked in a local `_migrations` table so re-opening a workspace
 * is a no-op.
 */
export function runMigrations(db: Database.Database): void {
  try {
    db.pragma('journal_mode = WAL')
  } catch {
    // WAL needs shared-memory (mmap) locking that some filesystems refuse —
    // network drives, and notably folders synced by OneDrive/Dropbox, which
    // is where Windows' default "Documents" location often lives. Fall back
    // to the rollback journal, which works everywhere; this app is a single
    // process per workspace, so WAL's concurrent-reader benefit doesn't matter.
    db.pragma('journal_mode = DELETE')
  }
  db.pragma('foreign_keys = ON')

  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  )`)

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((row) => (row as { name: string }).name)
  )

  const applyMigration = db.transaction((name: string, sql: string) => {
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const statement of statements) {
      db.exec(statement)
    }
    db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(
      name,
      new Date().toISOString()
    )
  })

  for (const migration of migrations) {
    if (!applied.has(migration.name)) {
      applyMigration(migration.name, migration.sql)
    }
  }
}
