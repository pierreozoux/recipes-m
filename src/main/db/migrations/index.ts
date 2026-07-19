import m0000 from './0000_chief_riptide.sql?raw'

/**
 * Migrations are bundled as raw strings (via Vite's `?raw` import) so the
 * packaged app never depends on a loose `.sql` file being copied next to
 * the compiled main bundle. Drizzle Kit regenerates these files under
 * `pnpm db:generate`; add newly generated files here, in order.
 */
export const migrations: { name: string; sql: string }[] = [{ name: '0000_chief_riptide', sql: m0000 }]
