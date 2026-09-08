import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { app, releases, render, repo } from "../dist/server/entry-server.js"
import { llms } from "./llms.js"
import { sitemap } from "./sitemap.js"

const SITE = "https://doska.sh"

/**
 * The home page's `<lastmod>`. Its copy lives in components rather than in
 * frontmatter, so there is nothing to read it off — bump it when the hero or
 * the demo board changes.
 */
const HOME_UPDATED = "2026-08-07"

const dist = fileURLToPath(new URL("../dist/", import.meta.url))
const template = readFileSync(dist + "index.html", "utf-8")

writeFileSync(
  dist + "index.html",
  template.replace("<!--app-html-->", render())
)
writeFileSync(
  dist + "sitemap.xml",
  sitemap(SITE, [{ path: "/", updated: HOME_UPDATED }])
)
writeFileSync(dist + "llms.txt", llms(SITE, { app, repo, releases }))

// The SSR bundle is a build artefact, not something we deploy.
rmSync(dist + "server", { recursive: true, force: true })

console.log("prerendered /")
