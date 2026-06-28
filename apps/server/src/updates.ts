import type { FastifyInstance, FastifyRequest } from "fastify"

// Update distribution endpoint for the Tauri desktop app.
//
// The desktop app's updater is configured (src-tauri/tauri.conf.json) to poll
// THIS server, never GitHub directly:
// while the repo is private, GitHub release assets need auth to download, so we
// proxy them here with a server-side token. When the repo goes public, the same
// endpoint keeps working unchanged (the token just becomes unnecessary), and
// every already-installed app keeps pointing here. No client re-release needed.
//
// Every git tag publishes its own GitHub Release (bundles + latest.json), so all
// versions are kept around. The updater endpoint is baked into the binary, so a
// client doesn't poll its own sync server for builds — it polls whichever host
// the binary was built against. To keep a client from jumping ahead of a
// (possibly self-hosted, lagging) sync server, the client sends its server's
// version in `x-deck-server-version` and we serve the newest release on that
// major.minor line rather than the overall latest. No header → overall latest.
//
// Env:
//   GITHUB_TOKEN  token with read access to the releases repo (needed only while
//                 it's private)
//   BASE_URL      this server's public origin, e.g. https://deck.example.com
//                 (used to rewrite asset URLs in the manifest back to us)

const repo = "romenkova/doska"
const token = process.env.GITHUB_TOKEN
const publicBase = (process.env.BASE_URL ?? "").replace(/\/+$/, "")

type GhAsset = { name: string; url: string; browser_download_url: string }
type GhRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: GhAsset[]
}

type SemVer = [major: number, minor: number, patch: number]

function ghHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "deck-update-proxy",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/** [major, minor, patch] from a version/tag like "v0.3.2" or "0.3.2". */
function parseVersion(value: string): SemVer | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(value)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/** Descending semver order (newest first). */
function compareDesc(a: SemVer, b: SemVer): number {
  return b[0] - a[0] || b[1] - a[1] || b[2] - a[2]
}

/** Reads the client's sync-server version hint, if present. */
function serverLine(req: FastifyRequest): SemVer | null {
  const raw = req.headers["x-deck-server-version"]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ? parseVersion(value) : null
}

async function listReleases(): Promise<GhRelease[]> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases?per_page=100`,
    { headers: ghHeaders("application/vnd.github+json") }
  )
  if (!res.ok) throw new Error(`GitHub releases: ${res.status}`)
  return (await res.json()) as GhRelease[]
}

async function releaseByVersion(version: string): Promise<GhRelease | null> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/tags/v${version}`,
    { headers: ghHeaders("application/vnd.github+json") }
  )
  if (!res.ok) return null
  return (await res.json()) as GhRelease
}

// Picks the release to offer. When the client pins to a server line, we return
// the newest published build whose major.minor matches; if none exists on that
// line we offer nothing (better than a mismatched jump). With no pin we return
// the newest release overall (official channel).
async function selectRelease(line: SemVer | null): Promise<GhRelease | null> {
  const versioned = (await listReleases())
    .filter((r) => !r.draft && !r.prerelease)
    .map((r) => ({ r, v: parseVersion(r.tag_name) }))
    .filter((x): x is { r: GhRelease; v: SemVer } => x.v !== null)
    .sort((a, b) => compareDesc(a.v, b.v))
  if (versioned.length === 0) return null
  if (!line) return versioned[0].r
  return (
    versioned.find(({ v }) => v[0] === line[0] && v[1] === line[1])?.r ?? null
  )
}

export function registerUpdateRoutes(app: FastifyInstance): void {
  // The updater fetches this first. We take the selected release's generated
  // latest.json and rewrite each platform's `url` so the binary download also
  // routes back through this proxy (otherwise it would point at an auth-gated
  // GitHub asset URL the app can't reach). The version is encoded in the
  // rewritten path so the download streams from the matching release, not just
  // the overall latest.
  app.get("/api/desktop/latest.json", async (req, reply) => {
    try {
      const release = await selectRelease(serverLine(req))
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
      const version = release.tag_name.replace(/^v/, "")
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

  // Streams a release asset (the signed bundle) by version + name, with auth
  // applied server-side so the client never needs a token.
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
