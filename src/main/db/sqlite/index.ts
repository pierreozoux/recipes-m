import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { DbClient } from '../client'
import { runMigrations } from './migrate'
import { SqliteIngredientsRepository, SqliteRecipesRepository } from './repositories'
import * as schema from './schema'

export function createSqliteDbClient(databaseFilePath: string): DbClient {
  const sqlite = new Database(databaseFilePath)
  runMigrations(sqlite)
  const db = drizzle(sqlite, { schema })

  return {
    ingredients: new SqliteIngredientsRepository(db),
    recipes: new SqliteRecipesRepository(db),
    close: () => sqlite.close()
  }
}
