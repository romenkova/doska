import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Standalone of `vite.config.ts`: unit tests need neither the PWA plugin nor
// the React transform, and loading them costs seconds per run.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
  },
})
