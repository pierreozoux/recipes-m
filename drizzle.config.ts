import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/sqlite/schema.ts',
  out: './src/main/db/migrations'
})
