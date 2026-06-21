import type { Pool } from "pg"

/** Waits until `pool` answers a trivial query, retrying on connection refusal. */
export async function waitForConnection(
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
