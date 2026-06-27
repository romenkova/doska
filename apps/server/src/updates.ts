import type { FastifyInstance } from "fastify"

// Update distribution endpoint for the Tauri desktop app.
//
// The desktop app's updater is configured (src-tauri/tauri.conf.json) to poll
// THIS server, never GitHub directly:
// while the repo is private, GitHub release assets need auth to download, so we
// proxy them here with a server-side token. When the repo goes public, the same
// endpoint keeps working unchanged (the token just becomes unnecessary), and
// every already-installed app keeps pointing here. No client re-release needed.
//
// Env:
//   UPDATE_REPO         "owner/repo" of the release source (required to enable)
//   GITHUB_TOKEN        token with read access (needed only while private)
//   UPDATE_PUBLIC_BASE  this server's public origin, e.g. https://updates.deck.app
//                       (used to rewrite asset URLs in the manifest back to us)

const repo = process.env.UPDATE_REPO
const token = process.env.GITHUB_TOKEN
const publicBase = (process.env.UPDATE_PUBLIC_BASE ?? "").replace(/\/+$/, "")

type GhAsset = { name: string; url: string; browser_download_url: string }
type GhRelease = { assets: GhAsset[] }

function ghHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "deck-update-proxy",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function latestRelease(): Promise<GhRelease> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: ghHeaders("application/vnd.github+json"),
  })
  if (!res.ok) throw new Error(`GitHub releases: ${res.status}`)
  return (await res.json()) as GhRelease
}

export function registerUpdateRoutes(app: FastifyInstance): void {
  if (!repo) {
    app.log.warn("UPDATE_REPO not set — desktop update endpoint disabled")
    return
  }

  // The updater fetches this first. We take tauri-action's generated
  // latest.json and rewrite each platform's `url` so the binary download also
  // routes back through this proxy (otherwise it would point at an auth-gated
  // GitHub asset URL the app can't reach).
  app.get("/desktop/latest.json", async (_req, reply) => {
    try {
      const release = await latestRelease()
      const manifestAsset = release.assets.find((a) => a.name === "latest.json")
      if (!manifestAsset) return reply.code(404).send({ error: "No manifest" })

      const res = await fetch(manifestAsset.url, {
        headers: ghHeaders("application/octet-stream"),
      })
      if (!res.ok) return reply.code(502).send({ error: "Manifest fetch failed" })

      const manifest = (await res.json()) as {
        platforms?: Record<string, { url: string }>
      }
      const base = publicBase || `${_req.protocol}://${_req.host}`
      for (const platform of Object.values(manifest.platforms ?? {})) {
        const name = platform.url.split("/").pop() ?? ""
        platform.url = `${base}/desktop/download/${encodeURIComponent(name)}`
      }
      return reply.send(manifest)
    } catch (err) {
      app.log.error(err)
      return reply.code(502).send({ error: "Update lookup failed" })
    }
  })

  // Streams a release asset (the signed bundle) by name, with auth applied
  // server-side so the client never needs a token.
  app.get<{ Params: { name: string } }>(
    "/desktop/download/:name",
    async (req, reply) => {
      try {
        const release = await latestRelease()
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
