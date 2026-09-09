import { execSync } from "child_process"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

/**
 * Preloads the font subsets every page needs. They live behind an `@import` in
 * index.css, so without this the browser only discovers the woff2 after the CSS
 * has parsed — html → css → font, three serial round trips before any text
 * paints in the real face. Covers `latin` and `cyrillic` only — the `-ext` and
 * per-language subsets stay lazy. Preloading defeats unicode-range, so a board
 * with no Cyrillic on it still pays for the Cyrillic subsets; that is the price
 * of a Cyrillic board not paying the three round trips.
 *
 * `crossorigin` is required even same-origin: it has to match the anonymous-CORS
 * mode a CSS-driven font fetch uses, or the preload is discarded and refetched.
 */
function preloadFonts(): Plugin {
  let base = "/"
  return {
    name: "preload-fonts",
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        return Object.keys(ctx.bundle ?? {})
          .filter((file) =>
            /-(latin|cyrillic)-wght-normal-[^/]+\.woff2$/.test(file)
          )
          .map((file) => ({
            tag: "link",
            attrs: {
              rel: "preload",
              as: "font",
              type: "font/woff2",
              href: base + file,
              crossorigin: "anonymous",
            },
            injectTo: "head-prepend" as const,
          }))
      },
    },
  }
}

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
    preloadFonts(),
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
          "A local-first Kanban board where every card is Markdown. Works offline and syncs through a server you host.",
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
        // Precaching every subset ships Vietnamese glyphs to everyone. The
        // excluded ones still load from the network when a body actually
        // contains those characters — they just aren't available offline.
        globIgnores: ["**/*-vietnamese-*.woff2"],
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
          // Reachable only through the lazily-imported calendar. Naming any
          // chunk for these pulls them in eagerly — a manual assignment
          // overrides Rollup's dynamic-import split — so they fall through to
          // keep the deferral `date-input-calendar` is written to get.
          if (/[\\/](date-fns|react-day-picker)[\\/]/.test(id)) return
          // Editor
          if (
            /[\\/](@codemirror|@lezer|@marijn|style-mod|w3c-keyname|crelt)[\\/]/.test(
              id
            )
          )
            return
          // The markdown parsing stack (the unified/remark/micromark/mdast
          // ecosystem) is the heaviest dep.
          if (
            /[\\/](remark|micromark|mdast|hast|unist|unified|vfile|property-information|character-entities|decode-named-character-reference|html-url-attributes|space-separated-tokens|comma-separated-tokens|trough|bail|devlop|zwitch|ccount|escape-string-regexp|markdown-table)/.test(
              id
            )
          ) {
            return "markdown"
          }
          if (id.includes("@hello-pangea/dnd")) return "dnd"
          if (/[\\/](motion|motion-dom|motion-utils)[\\/]/.test(id))
            return "motion"
          if (id.includes("@base-ui")) return "base-ui"
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react"
          return "vendor"
        },
      },
    },
  },
})
