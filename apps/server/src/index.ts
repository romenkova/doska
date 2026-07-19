import { buildApp } from "./app"
import { seedAccount } from "./auth/seed"
import { runMigrations } from "./db/utils/run-migrations"
import { env } from "./env"

const app = buildApp()

const { port, host } = env

runMigrations()
  .then(seedAccount)
  .then(() => app.listen({ port, host }))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
