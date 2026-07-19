import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"
import { startServer, type Harness } from "./harness"

let h: Harness

beforeAll(async () => {
  h = await startServer()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const releases = [
  {
    tag_name: "v0.4.0",
    draft: false,
    prerelease: false,
    assets: [
      { name: "latest.json", url: "https://gh/asset/manifest-040" },
      { name: "app-0.4.0.dmg", url: "https://gh/asset/dmg-040" },
    ],
  },
  {
    tag_name: "v0.3.5",
    draft: false,
    prerelease: false,
    assets: [{ name: "latest.json", url: "https://gh/asset/manifest-035" }],
  },
]

const manifest040 = {
  version: "0.4.0",
  platforms: { "darwin-aarch64": { url: "https://github.com/r/app-0.4.0.dmg" } },
}
const manifest035 = {
  version: "0.3.5",
  platforms: { "darwin-aarch64": { url: "https://github.com/r/app-0.3.5.dmg" } },
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  })
}

function stubGitHub() {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input)
    if (url.includes("/releases/tags/v0.4.0")) return json(releases[0])
    if (url.includes("/releases/tags/v0.3.5")) return json(releases[1])
    if (url.includes("/releases/tags/")) return new Response(null, { status: 404 })
    if (url.includes("manifest-040")) return json(manifest040)
    if (url.includes("manifest-035")) return json(manifest035)
    if (url.includes("dmg-040"))
      return new Response("BINARYX", { headers: { "content-length": "7" } })
    throw new Error(`unexpected fetch: ${url}`)
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("/api/version", () => {
  test("returns the server version", async () => {
    const res = await h.app.inject({ method: "GET", url: "/api/version" })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty("version")
  })
})

describe("/api/desktop/latest.json", () => {
  test("serves the pinned version and rewrites the download url", async () => {
    stubGitHub()
    const res = await h.app.inject({
      method: "GET",
      url: "/api/desktop/latest.json",
      headers: { "x-deck-server-version": "0.4.0" },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.version).toBe("0.4.0")
    // The asset url now points back at this proxy, not GitHub.
    expect(body.platforms["darwin-aarch64"].url).toContain(
      "/api/desktop/download/0.4.0/app-0.4.0.dmg"
    )
  })

  test("serves the exact pinned version, not the overall latest", async () => {
    stubGitHub()
    const res = await h.app.inject({
      method: "GET",
      url: "/api/desktop/latest.json",
      headers: { "x-deck-server-version": "0.3.5" },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.version).toBe("0.3.5")
    expect(body.platforms["darwin-aarch64"].url).toContain(
      "/api/desktop/download/0.3.5/"
    )
  })

  test("400s without a server version", async () => {
    stubGitHub()
    const res = await h.app.inject({
      method: "GET",
      url: "/api/desktop/latest.json",
    })
    expect(res.statusCode).toBe(400)
  })

  test("404s when the pinned version has no release", async () => {
    stubGitHub()
    const res = await h.app.inject({
      method: "GET",
      url: "/api/desktop/latest.json",
      headers: { "x-deck-server-version": "9.9.0" },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe("/api/desktop/download/:version/:name", () => {
  test("streams the requested asset", async () => {
    stubGitHub()
    const res = await h.app.inject({
      method: "GET",
      url: "/api/desktop/download/0.4.0/app-0.4.0.dmg",
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("application/octet-stream")
    expect(res.body).toBe("BINARYX")
  })

  test("404s for an unknown asset", async () => {
    stubGitHub()
    const res = await h.app.inject({
      method: "GET",
      url: "/api/desktop/download/0.4.0/nope.dmg",
    })
    expect(res.statusCode).toBe(404)
  })
})
