/** Waits until `query` succeeds, retrying on connection refusal. */
export async function waitForConnection(
  query: () => Promise<unknown>,
  attempts = 30,
  delayMs = 250
): Promise<void> {
  for (let i = 0; ; i++) {
    try {
      await query()
      return
    } catch (err) {
      if (i >= attempts) throw err
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}
