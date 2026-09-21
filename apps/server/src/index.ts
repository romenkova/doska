import { buildApp } from "./app"
import { seedAccount } from "./auth/seed"
import { runMigrations } from "./db/utils/run-migrations"
import { env } from "./env"
import { startPurgeJob } from "./purge-job"

const app = buildApp()

const { port, host } = env

process.on("uncaughtException", (err) => {
  app.log.fatal({ err }, "uncaught exception")
  process.exit(1)
})
process.on("unhandledRejection", (err) => {
  app.log.fatal({ err }, "unhandled rejection")
  process.exit(1)
})

runMigrations()
  .then(seedAccount)
  .then(() => app.listen({ port, host }))
  .then(() => startPurgeJob(app.log))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
