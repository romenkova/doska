import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Test the production bundle: build, then serve it with `vite preview`.
    command: "pnpm run build && pnpm run preview --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
