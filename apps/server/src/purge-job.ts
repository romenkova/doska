import { storageFromEnv } from "@doska/file-storage/server"
import type { FastifyBaseLogger } from "fastify"
import { purgeExpired } from "./db/sync/purge"

/** How often the retention sweep runs. The window is 14 days; hourly is plenty
 * of resolution, and keeps each sweep small. */
const INTERVAL_MS = 60 * 60 * 1000

/**
 * Runs the retention sweep on a timer, dropping the attachments of the cards it
 * removed. Storage failures are logged and left: an orphaned object costs
 * space, whereas a throw would stop the sweep from ever finishing.
 */
async function sweep(log: FastifyBaseLogger): Promise<void> {
  try {
    const result = await purgeExpired()
    if (
      result.cards + result.columns + result.dashboards + result.history ===
      0
    )
      return

    const storage = storageFromEnv()
    for (const key of result.attachments) {
      try {
        await storage?.remove(key)
      } catch (err) {
        log.warn({ err, key }, "purge: could not remove attachment")
      }
    }

    log.info(
      {
        cards: result.cards,
        columns: result.columns,
        dashboards: result.dashboards,
        history: result.history,
        attachments: result.attachments.length,
      },
      "purge: removed expired tombstones"
    )
  } catch (err) {
    log.error({ err }, "purge: sweep failed")
  }
}

/** Starts the sweep loop; returns a stop function for tests and shutdown. */
export function startPurgeJob(log: FastifyBaseLogger): () => void {
  void sweep(log)
  const timer = setInterval(() => void sweep(log), INTERVAL_MS)
  // Nothing should be kept alive by the sweep alone.
  timer.unref()
  return () => clearInterval(timer)
}
