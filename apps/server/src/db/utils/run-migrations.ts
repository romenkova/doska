import path from "node:path"
import { fileURLToPath } from "node:url"
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator"
import type { PgliteDatabase } from "drizzle-orm/pglite"
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator"
import { Pool } from "pg"
import { waitForConnection } from "./wait-for-connection"
import { env } from "../../env"
import { getDB } from "../get-db"
import type * as schema from "../schema"

/** Applies any pending migrations. Run once at startup, before serving. */
export async function runMigrations(): Promise<void> {
  const db = getDB()
  const here = path.dirname(fileURLToPath(import.meta.url))
  const migrationsFolder = path.resolve(here, "../../../drizzle")

  const { databaseUrl } = env

  // PGlite runs in-process, so it needs no connection wait; only the real
  // Postgres path waits for the server to accept connections before migrating.
  if (databaseUrl) {
    await waitForConnection(new Pool({ connectionString: databaseUrl }))
    return migrateNodePg(db, { migrationsFolder })
  }

  // PG for e2e and dev
  return migratePglite(db as unknown as PgliteDatabase<typeof schema>, {
    migrationsFolder,
  })
}
