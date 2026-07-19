import { buildApp } from "./app"
import { seedAccount } from "./auth/seed"
import { runMigrations } from "./db/utils/run-migrations"

const app = buildApp()

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? "0.0.0.0"

runMigrations()
  .then(seedAccount)
  .then(() => app.listen({ port, host }))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
