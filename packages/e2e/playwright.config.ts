import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIR = path.resolve(here, "../../apps/client")
const SERVER_DIR = path.resolve(here, "../../apps/server")

/**
 * The sync e2e tests need a real backend, so the harness boots two servers:
 * the API and the `vite preview` bundle (which proxies `/rpc` to the API via
 * `RPC_TARGET`, see vite.config). The API runs on its own port backed by an
 * in-memory PGlite (no DB_FILE), so each boot starts from an empty server and a
 * run never inherits another run's board state.
 */
const SYNC_PORT = 3100

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
      // Sync API. No DB_FILE, so PGlite runs in-memory and each boot starts from
      // an empty server; the start script migrates the schema before listening.
      command: "pnpm run start",
      cwd: SERVER_DIR,
      // Sync is gated; boot the API with the single credential pair the specs
      // sign in with (see `TEST_CREDENTIALS` in helpers).
      env: {
        PORT: String(SYNC_PORT),
        AUTH_LOGIN: "e2e",
        AUTH_PASSWORD: "e2e-secret",
        AUTH_SECRET: "e2e-test-secret",
      },
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
