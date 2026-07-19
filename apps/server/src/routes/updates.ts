import type { FastifyInstance, FastifyRequest } from "fastify"
import pkg from "../../package.json" with { type: "json" }
import { env } from "../env"

// Update proxy for the Tauri desktop app. The updater polls this server (not
// GitHub) so a client installs its sync server's exact version rather than the
// global latest — the client sends `x-deck-server-version`, we serve that
// release. Each git tag has its own GitHub Release, so any version is fetchable.
//
// BASE_URL: this server's public origin, used to rewrite asset URLs back to us.

const repo = "romenkova/doska"
const publicBase = env.baseUrl ?? ""

type GhAsset = { name: string; url: string; browser_download_url: string }
type GhRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: GhAsset[]
}

function ghHeaders(accept: string): Record<string, string> {
  return {
    Accept: accept,
    "User-Agent": "deck-update-proxy",
  }
}

/** The client's sync-server version, from the pinning header. */
function serverVersion(req: FastifyRequest): string | null {
  const raw = req.headers["x-deck-server-version"]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value?.replace(/^v/, "") || null
}

async function releaseByVersion(version: string): Promise<GhRelease | null> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/tags/v${version}`,
    { headers: ghHeaders("application/vnd.github+json") }
  )
  if (!res.ok) return null
  return (await res.json()) as GhRelease
}

export function registerUpdateRoutes(app: FastifyInstance): void {
  // The client reads this to learn its server's version, then pins updates to it.
  app.get("/api/version", async (_req, reply) => {
    return reply.send({ version: env.appVersion || pkg.version })
  })

  // Serves the release's latest.json, rewriting each platform `url` to route the
  // binary download back through this proxy (version encoded in the path).
  app.get("/api/desktop/latest.json", async (req, reply) => {
    try {
      const version = serverVersion(req)
      if (!version)
        return reply.code(400).send({ error: "No server version" })

      const release = await releaseByVersion(version)
      if (!release)
        return reply.code(404).send({ error: "No matching release" })

      const manifestAsset = release.assets.find((a) => a.name === "latest.json")
      if (!manifestAsset) return reply.code(404).send({ error: "No manifest" })

      const res = await fetch(manifestAsset.url, {
        headers: ghHeaders("application/octet-stream"),
      })
      if (!res.ok)
        return reply.code(502).send({ error: "Manifest fetch failed" })

      const manifest = (await res.json()) as {
        version?: string
        platforms?: Record<string, { url: string }>
      }
      const base = publicBase || `${req.protocol}://${req.host}`
      for (const platform of Object.values(manifest.platforms ?? {})) {
        const name = platform.url.split("/").pop() ?? ""
        platform.url = `${base}/api/desktop/download/${encodeURIComponent(version)}/${encodeURIComponent(name)}`
      }
      return reply.send(manifest)
    } catch (err) {
      app.log.error(err)
      return reply.code(502).send({ error: "Update lookup failed" })
    }
  })

  // Streams a release asset (the signed bundle) by version + name.
  app.get<{ Params: { version: string; name: string } }>(
    "/api/desktop/download/:version/:name",
    async (req, reply) => {
      try {
        const release = await releaseByVersion(req.params.version)
        if (!release) return reply.code(404).send({ error: "No such release" })

        const asset = release.assets.find((a) => a.name === req.params.name)
        if (!asset) return reply.code(404).send({ error: "No such asset" })

        const res = await fetch(asset.url, {
          headers: ghHeaders("application/octet-stream"),
        })
        if (!res.ok || !res.body) {
          return reply.code(502).send({ error: "Asset fetch failed" })
        }
        reply.header("content-type", "application/octet-stream")
        const len = res.headers.get("content-length")
        if (len) reply.header("content-length", len)
        return reply.send(res.body)
      } catch (err) {
        app.log.error(err)
        return reply.code(502).send({ error: "Asset download failed" })
      }
    }
  )
}
