import path from "node:path"
import { fileURLToPath } from "node:url"
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator"
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator"
import { Pool } from "pg"
import { waitForConnection } from "./wait-for-connection"
import { getDB } from "../get-db"

/** Applies any pending migrations. Run once at startup, before serving. */
export async function runMigrations(): Promise<void> {
  const db = getDB()
  const here = path.dirname(fileURLToPath(import.meta.url))
  const migrationsFolder = path.resolve(here, "../../../drizzle")

  const url = process.env.DATABASE_URL
  const pool = new Pool({ connectionString: url })

  await waitForConnection(pool)

  if (url) {
    await migrateNodePg(db, { migrationsFolder })
  } else {
    migratePglite(db, { migrationsFolder })
  }
}
