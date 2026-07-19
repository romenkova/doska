import type { IncomingMessage } from "node:http"
import {
  s3StorageFromEnv,
  type FetchedFile,
  type PutResult,
} from "@doska/file-storage/server"
import type { FastifyInstance } from "fastify"

/**
 * Attachment upload/download routes.
 */

/** The slice of storage the routes touch; lets tests pass an in-memory fake. */
export interface ServerStorage {
  readonly maxBytes: number
  put(
    bytes: Buffer,
    meta: { name: string; mime: string | string[] | undefined }
  ): Promise<PutResult>
  fetch(key: string): Promise<FetchedFile>
  remove(key: string): Promise<void>
}

/** Pulls the object key out of `/api/files/<key>`, guarding traversal. */
function keyFromPath(url: string): string | null {
  const raw = url.replace(/^\/api\/files\//, "").split("?")[0]
  const key = decodeURIComponent(raw)
  if (!key || key.includes("..")) return null
  return key
}

/** Buffers the request body, aborting past `limit` so a huge upload can't OOM. */
function collectBody(
  req: IncomingMessage,
  limit: number
): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on("data", (chunk: Buffer) => {
      size += chunk.length
      if (size > limit) {
        req.destroy()
        resolve(null)
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", () => resolve(null))
  })
}

export function registerFileRoutes(
  app: FastifyInstance,
  storage: ServerStorage | null = s3StorageFromEnv()
): void {
  // Raw binary uploads: no parsing, the handler reads the stream itself (same
  // no-op pattern as the parsers in index.ts).
  app.addContentTypeParser("application/octet-stream", (_req, _payload, done) =>
    done(null, undefined)
  )

  // Accepts the file bytes and streams them into S3. The original filename and
  // MIME ride in headers (the body is the raw file), so nothing about the object
  // is trusted from the client beyond its bytes.
  app.post("/api/files", async (req, reply) => {
    if (!storage)
      return reply.code(503).send({ error: "File storage not configured" })

    const nameHeader = req.headers["x-file-name"]
    const name = decodeURIComponent(
      Array.isArray(nameHeader) ? nameHeader[0] : (nameHeader ?? "file")
    )

    const body = await collectBody(req.raw, storage.maxBytes)
    if (!body) return reply.code(413).send({ error: "File too large" })
    if (body.length === 0) return reply.code(400).send({ error: "Empty file" })

    const stored = await storage.put(body, {
      name,
      mime: req.headers["x-file-mime"],
    })
    return reply.send(stored)
  })

  // Streams the object back through the server. Proxying (rather than
  // redirecting to a presigned URL) keeps every browser request on this origin —
  // the bucket URL is never exposed and reads need no S3 CORS.
  app.get("/api/files/*", async (req, reply) => {
    if (!storage)
      return reply.code(503).send({ error: "File storage not configured" })

    const key = keyFromPath(req.url)
    if (!key) return reply.code(400).send({ error: "Bad key" })

    try {
      const file = await storage.fetch(key)
      reply.header("content-type", file.contentType)
      if (file.contentLength != null)
        reply.header("content-length", String(file.contentLength))
      // Never let the browser sniff a different type than we declare, and only
      // render known-safe types inline (PDFs, images, …) — everything else
      // downloads. Together these stop a same-origin script-injection via upload.
      reply.header("x-content-type-options", "nosniff")
      reply.header("content-disposition", file.disposition)
      // Same-origin, but the bytes are private — don't let shared caches hold them.
      reply.header("cache-control", "private, max-age=300")
      return reply.send(file.body)
    } catch {
      return reply.code(404).send({ error: "Not found" })
    }
  })

  app.delete("/api/files/*", async (req, reply) => {
    if (!storage)
      return reply.code(503).send({ error: "File storage not configured" })

    const key = keyFromPath(req.url)
    if (!key) return reply.code(400).send({ error: "Bad key" })
    await storage.remove(key)
    return reply.send({ ok: true })
  })
}
