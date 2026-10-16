import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"
import { seenModals } from "./e2e/helpers/seen-modals"

const here = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIR = path.resolve(here, "../../apps/client")
const SERVER_DIR = path.resolve(here, "../../apps/server")
const FILES_TMP = path.join(os.tmpdir(), "doska-e2e-files")

/**
 * The sync e2e tests need a real backend, so the harness boots two servers:
 * the API and the `vite preview` bundle (which proxies `/api` to the API via
 * `RPC_TARGET`, see vite.config). The API runs on its own port backed by an
 * in-memory PGlite (no DB_FILE), so each boot starts from an empty server and a
 * run never inherits another run's board state.
 */
const SYNC_PORT = 3100
const BASE_URL = "http://localhost:4173"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    storageState: seenModals(BASE_URL),
    colorScheme: "dark",
    // Keep a trace from the failing attempt so a rare flake is debuggable after
    // the fact (`npx playwright show-trace`), without the cost on green runs.
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    serviceWorkers: "block",
  },
  // CI runs chromium only; firefox/webkit are for local cross-browser checks.
  projects: process.env.CI
    ? [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
    : [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
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
        // The whole suite is one loopback IP: every spec signs in, and every
        // page load checks the session. That is far past any honest per-IP cap,
        // so the limiter comes off here rather than the production numbers being
        // widened to accommodate a test harness.
        AUTH_RATE_LIMIT: "off",
        // Same story for the public board route.
        PUBLIC_RATE_LIMIT: "off",
        // The bundle is served from :4173 and the API answers on :3100, so every
        // authenticated auth call is cross-origin here. A real deploy serves both
        // from one origin (and desktop's `tauri://` origins are trusted in the
        // auth config); only this harness needs the split spelled out.
        AUTH_TRUSTED_ORIGINS: "http://localhost:4173",
        // Attachments are stored on disk at a path that only exists inside the
        // container image, so point them at a temp dir and the specs can upload
        // for real here too. Reused across runs — every key is a fresh UUID, so
        // one run never sees another's blobs.
        FILE_DIR_OVERRIDE: FILES_TMP,
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
