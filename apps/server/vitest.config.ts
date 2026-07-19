import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    setupFiles: ["./integration-tests/setup.ts"],
    include: ["integration-tests/**/*.test.ts"],
    // Each test file gets its own process, so `getDB()`'s singleton is a fresh
    // in-memory PGlite per file — no cross-file bleed.
    pool: "forks",
  },
})
