import path from "node:path"
import { fileURLToPath } from "node:url"
import { PGlite } from "@electric-sql/pglite"
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres"
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { drizzle as drizzlePglite } from "drizzle-orm/pglite"
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator"
import { Pool } from "pg"
import * as schema from "./schema"

/**
 * Prod points `DATABASE_URL` at a real server;
 * local dev and e2e fall back to PGlite
 *
 * PGlite persists to `DB_FILE` (a directory) when set, or runs in-memory when
 * not, which is how e2e gets a clean server on each boot.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.resolve(here, "../../drizzle")

type DB = NodePgDatabase<typeof schema>

const url = process.env.DATABASE_URL

let database: DB
let migrateFn: () => Promise<void>

if (url) {
  const pool = new Pool({ connectionString: url })
  database = drizzleNodePg(pool, { schema })
  migrateFn = async () => {
    // The DB may not be accepting connections yet — `pnpm dev` boots this
    // alongside the local `db:serve` socket, and a prod deploy can race its
    // database. Poll briefly before migrating instead of crashing on boot.
    await waitForConnection(pool)
    await migrateNodePg(database, { migrationsFolder })
  }
} else {
  const client = new PGlite(process.env.DB_FILE)
  const pglite = drizzlePglite(client, { schema })
  // PGlite and node-postgres share the pg-core query API; the SQL generated is
  // the same, so the app code can stay dialect-agnostic behind this one type.
  database = pglite as unknown as DB
  migrateFn = () => migratePglite(pglite, { migrationsFolder })
}

export const db = database

/** Waits until `pool` answers a trivial query, retrying on connection refusal. */
async function waitForConnection(
  pool: Pool,
  attempts = 30,
  delayMs = 250
): Promise<void> {
  for (let i = 0; ; i++) {
    try {
      await pool.query("select 1")
      return
    } catch (err) {
      if (i >= attempts) throw err
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}

/** Applies any pending migrations. Run once at startup, before serving. */
export function runMigrations(): Promise<void> {
  return migrateFn()
}
