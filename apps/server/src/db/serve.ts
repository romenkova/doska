import path from "node:path"
import { fileURLToPath } from "node:url"
import { PGlite } from "@electric-sql/pglite"
import { PGLiteSocketServer } from "@electric-sql/pglite-socket"
import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import * as schema from "./schema"

/**
 * Runs the local PGlite database as a real Postgres socket server so the app,
 * Drizzle Studio, and any GUI / psql can share one live instance — no embedded
 * single-connection locking. This process is the sole owner of `DB_FILE`; point
 * everything else at it via `DATABASE_URL=postgres://127.0.0.1:<port>/postgres`.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.resolve(here, "../../drizzle")

const dataDir = process.env.DB_FILE ?? "pgdata"
const port = Number(process.env.PG_SOCKET_PORT ?? 5432)
const host = process.env.PG_SOCKET_HOST ?? "127.0.0.1"

const client = new PGlite(dataDir)
// Bring the schema up to date before exposing the socket, so a fresh dir serves
// migrated tables immediately.
await migrate(drizzle(client, { schema }), { migrationsFolder })

// PGlite executes one query at a time; a few connections lets the app, Studio
// and a psql session attach at once while queries queue behind the scenes.
const server = new PGLiteSocketServer({ db: client, port, host, maxConnections: 10 })
await server.start()
console.log(
  `PGlite serving ${dataDir} at postgres://${host}:${port}/postgres — Ctrl-C to stop`
)

async function shutdown(): Promise<void> {
  await server.stop()
  await client.close()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
