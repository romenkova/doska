import { readFileSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// Pages are React-rendered at build time only
// and the client bundle is framework-free.
function prerenderDev(): Plugin {
  return {
    name: "prerender-dev",
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!req.headers.accept?.includes("text/html")) return next()
          const url = (req.url ?? "/").split("?")[0]
          if (url !== "/") return next()
          try {
            const { render } = await server.ssrLoadModule(
              "/src/entry-server.tsx"
            )
            const template = await server.transformIndexHtml(
              url,
              readFileSync(
                path.resolve(import.meta.dirname, "index.html"),
                "utf-8"
              )
            )
            res.setHeader("Content-Type", "text/html")
            res.end(template.replace("<!--app-html-->", render()))
          } catch (error) {
            server.ssrFixStacktrace(error as Error)
            next(error)
          }
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  appType: "custom",
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 3002,
  },
  plugins: [react(), tailwindcss(), prerenderDev()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
