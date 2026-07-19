import { PGlite } from "@electric-sql/pglite"
import { PGLiteSocketServer } from "@electric-sql/pglite-socket"
import { env } from "./env"

/**
 * Runs the local PGlite database as a real Postgres socket server so the app,
 * Drizzle Studio, and any GUI / psql can share one live instance — no embedded
 * single-connection locking. This process is the sole owner of `DB_FILE`; point
 * everything else at it via `DATABASE_URL=postgres://127.0.0.1:<port>/postgres`.
 */
const dataDir = env.dbFile ?? "pgdata"
const port = env.pgSocketPort
const host = env.pgSocketHost

const client = new PGlite(dataDir)

// PGlite executes one query at a time; a few connections lets the app, Studio
// and a psql session attach at once while queries queue behind the scenes.
const server = new PGLiteSocketServer({
  db: client,
  port,
  host,
  maxConnections: 10,
})
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
