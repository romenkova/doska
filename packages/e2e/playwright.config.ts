import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIR = path.resolve(here, "../../apps/client")
const SERVER_DIR = path.resolve(here, "../../apps/server")

/**
 * The sync e2e tests need a real backend, so the harness boots two servers:
 * the API and the `vite preview` bundle (which proxies `/rpc` to the API via
 * `RPC_TARGET`, see vite.config). The API runs on its own port with a throwaway
 * SQLite file so a run never inherits another run's board state.
 */
const SYNC_PORT = 3100
const DB_FILE = path.join(os.tmpdir(), "deck-e2e.db")

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      // Sync API. `rm -f` drops any DB left by a prior run so each suite starts
      // from an empty server; `tsx` (the start script) recreates the schema.
      command: `rm -f "${DB_FILE}"* && pnpm run start`,
      cwd: SERVER_DIR,
      env: { PORT: String(SYNC_PORT), DB_FILE },
      port: SYNC_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Test the production bundle with `vite preview`. We build here (rather
      // than reusing CI's prior `turbo build`) because the e2e bundle bakes in a
      // short `VITE_SYNC_INTERVAL_MS`, so pull tests see a remote change in a
      // sub-second tick instead of the 10s production cadence.
      command: "pnpm run build && pnpm run preview --port 4173",
      cwd: CLIENT_DIR,
      env: {
        RPC_TARGET: `http://localhost:${SYNC_PORT}`,
        VITE_SYNC_INTERVAL_MS: "400",
      },
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
