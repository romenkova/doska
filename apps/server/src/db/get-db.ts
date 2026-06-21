import { PGlite } from "@electric-sql/pglite"
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { drizzle as drizzlePglite } from "drizzle-orm/pglite"
import { Pool } from "pg"
import * as schema from "./schema"

/**
 * Prod points `DATABASE_URL` at a real server;
 * local dev and e2e fall back to PGlite
 *
 * PGlite persists to `DB_FILE` (a directory) when set, or runs in-memory when
 * not, which is how e2e gets a clean server on each boot.
 */

export type DB = NodePgDatabase<typeof schema>

const url = process.env.DATABASE_URL

let database: DB | undefined

export function getDB() {
  if (database) return database

  if (url) {
    const pool = new Pool({ connectionString: url })
    database = drizzleNodePg(pool, { schema })
  } else {
    const client = new PGlite(process.env.DB_FILE)
    const pglite = drizzlePglite(client, { schema })
    // PGlite and node-postgres share the pg-core query API; the SQL generated is
    // the same, so the app code can stay dialect-agnostic behind this one type.
    database = pglite as unknown as DB
  }

  return database
}
