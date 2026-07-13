import { execSync } from "child_process"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

function appVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION
  try {
    return execSync("git describe --tags --always", {
      encoding: "utf-8",
    }).trim()
  } catch {
    return "dev"
  }
}

// https://vite.dev/config/
/**
 * What the server owns: the API (sync, and better-auth under /api/auth), the
 * OAuth discovery documents, and the MCP endpoint. Everything else is the SPA —
 * including /sign-in, which is where the MCP OAuth flow parks the browser.
 * Mirrors the proxy block in nginx.conf.
 */
const backendProxy = (target: string) =>
  Object.fromEntries(
    ["/api", "/mcp", "/.well-known"].map((path) => [path, target])
  )

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  preview: {
    port: 3001,
    // The e2e suite runs against `vite preview`, so it needs the same forwards
    // the dev server has — otherwise sync calls and sign-in 404 in tests. Honors
    // RPC_TARGET so the harness can point preview at the e2e sync server's port.
    proxy: backendProxy(process.env.RPC_TARGET ?? "http://localhost:3000"),
  },
  server: {
    port: 5173,
    strictPort: true,
    // Proxy backend calls to the API so the browser stays same-origin (no CORS).
    proxy: backendProxy("http://localhost:3000"),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The desktop build reuses this bundle inside a Tauri webview, where a
      // service worker is unwanted — so registration is opt-in from `lib/pwa`
      // rather than injected into index.html.
      injectRegister: null,
      registerType: "prompt",
      manifest: {
        name: "Doska",
        short_name: "Doska",
        description:
          "A fast, keyboard-friendly Kanban board for organizing tasks across columns.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#f7f7fa",
        theme_color: "#f7f7fa",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // `/api` (sync, auth, updater), `/mcp` and `/.well-known` (OAuth
        // discovery) are the backend; they must never resolve to the precached
        // app shell. Mirrors the nginx split.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/mcp/, /^\/\.well-known\//],
        cleanupOutdatedCaches: true,
        // Control the very first page load, so a new visitor is offline-ready
        // without a second visit. `skipWaiting` stays off: a *replacement*
        // worker waits for the user to accept the update banner.
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          // The markdown rendering stack (react-markdown + the unified/
          // remark/micromark/mdast/hast ecosystem) is the heaviest dep.
          if (
            /[\\/](react-markdown|remark|micromark|mdast|hast|unist|unified|vfile|property-information|character-entities|decode-named-character-reference|html-url-attributes|space-separated-tokens|comma-separated-tokens|trough|bail|devlop|zwitch|ccount|escape-string-regexp|markdown-table)/.test(
              id
            )
          ) {
            return "markdown"
          }
          if (id.includes("@hello-pangea/dnd")) return "dnd"
          if (id.includes("@base-ui")) return "base-ui"
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react"
          return "vendor"
        },
      },
    },
  },
})
