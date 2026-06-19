import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  preview: {
    port:3001
  },
  server: {
    // Proxy sync calls to the API so the browser stays same-origin (no CORS).
    proxy: {
      "/rpc": "http://localhost:3000",
    },
  },
  plugins: [react(), tailwindcss()],
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
