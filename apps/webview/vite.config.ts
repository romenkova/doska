import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

/** Wraps the finished page in a JS module, so the app can import it as a string. */
function htmlModule(): Plugin {
  return {
    name: "html-module",
    enforce: "post",
    generateBundle(_, bundle) {
      const page = bundle["index.html"]
      if (page?.type !== "asset") return
      this.emitFile({
        type: "asset",
        fileName: "html.js",
        source: `export default ${JSON.stringify(String(page.source))}\n`,
      })
      this.emitFile({
        type: "asset",
        fileName: "html.d.ts",
        source: "declare const html: string\nexport default html\n",
      })
    },
  }
}

export default defineConfig({
  server: { port: 5174, strictPort: true },
  plugins: [react(), tailwindcss(), viteSingleFile(), htmlModule()],
})
