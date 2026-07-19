import { Readable } from "node:stream"
import { beforeAll, describe, expect, test } from "vitest"
import { buildApp } from "../src/app"
import type { ServerStorage } from "../src/routes/files"
import { startServer, type Harness } from "./harness"

/** In-memory stand-in for the S3 storage, matching the slice the routes use. */
class FakeStorage implements ServerStorage {
  readonly maxBytes = 10
  private readonly blobs = new Map<string, Buffer>()

  async put(bytes: Buffer, meta: { name: string }) {
    const key = `att/${meta.name}`
    this.blobs.set(key, bytes)
    return { key, mime: "text/plain", size: bytes.length }
  }

  async fetch(key: string) {
    const bytes = this.blobs.get(key)
    if (!bytes) throw new Error("not found")
    return {
      body: Readable.from([bytes]),
      contentType: "text/plain",
      contentLength: bytes.length,
      disposition: "attachment" as const,
    }
  }

  async remove(key: string) {
    this.blobs.delete(key)
  }
}

let h: Harness
let storage: FakeStorage

beforeAll(async () => {
  storage = new FakeStorage()
  h = await startServer(storage)
})

const auth = () => ({ cookie: h.cookie })

describe("storage not configured", () => {
  test("every file route replies 503", async () => {
    const app = buildApp({ storage: null })
    for (const [method, url] of [
      ["POST", "/api/files"],
      ["GET", "/api/files/att/x"],
      ["DELETE", "/api/files/att/x"],
    ] as const) {
      const res = await app.inject({ method, url, headers: auth() })
      expect(res.statusCode).toBe(503)
    }
  })
})

describe("upload guards", () => {
  test("empty body → 400", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/files",
      headers: { ...auth(), "content-type": "application/octet-stream" },
      payload: Buffer.alloc(0),
    })
    expect(res.statusCode).toBe(400)
  })

  test("over the size cap → 413", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/files",
      headers: { ...auth(), "content-type": "application/octet-stream" },
      payload: Buffer.from("way too many bytes"),
    })
    expect(res.statusCode).toBe(413)
  })
})

describe("path guards", () => {
  test("a traversal key → 400", async () => {
    const res = await h.app.inject({
      method: "GET",
      url: "/api/files/..%2f..%2fetc",
      headers: auth(),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe("round trip", () => {
  test("put, get, then delete", async () => {
    const put = await h.app.inject({
      method: "POST",
      url: "/api/files",
      headers: {
        ...auth(),
        "content-type": "application/octet-stream",
        "x-file-name": "note.txt",
      },
      payload: Buffer.from("hello"),
    })
    expect(put.statusCode).toBe(200)
    const { key } = put.json()
    expect(key).toBe("att/note.txt")

    const get = await h.app.inject({
      method: "GET",
      url: `/api/files/${key}`,
      headers: auth(),
    })
    expect(get.statusCode).toBe(200)
    expect(get.body).toBe("hello")
    expect(get.headers["x-content-type-options"]).toBe("nosniff")

    const del = await h.app.inject({
      method: "DELETE",
      url: `/api/files/${key}`,
      headers: auth(),
    })
    expect(del.statusCode).toBe(200)

    const gone = await h.app.inject({
      method: "GET",
      url: `/api/files/${key}`,
      headers: auth(),
    })
    expect(gone.statusCode).toBe(404)
  })
})
