import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { render } from "./dist/server/entry-server.js"

const dist = fileURLToPath(new URL("./dist/", import.meta.url))

const template = readFileSync(dist + "index.html", "utf-8")
const html = template.replace("<!--app-html-->", render())
writeFileSync(dist + "index.html", html)

// The SSR bundle is a build artefact, not something we deploy.
rmSync(dist + "server", { recursive: true, force: true })

console.log("prerendered dist/index.html")
