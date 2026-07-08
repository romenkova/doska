import { randomUUID } from "node:crypto"
import type { IncomingMessage } from "node:http"
import type { Readable } from "node:stream"
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import type { FastifyInstance } from "fastify"
import { isAuthed } from "./auth"

/**
 * S3-backed attachment storage. The browser never talks to S3 and never holds
 * AWS credentials: uploads are POSTed here and streamed into the bucket, reads
 * are proxied back out. The bucket stays private, its URL is never exposed, no
 * S3 CORS is needed, and every route requires a valid session.
 *
 * Env:
 *   S3_BUCKET        bucket name (required to enable the feature)
 *   S3_REGION        bucket region (default us-east-1)
 *   S3_ENDPOINT      override for S3-compatible stores (MinIO, R2, …); optional
 *   FILE_MAX_BYTES   upload size cap (default 25 MiB)
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  via the SDK default credential chain
 */

const bucket = process.env.S3_BUCKET
const region = process.env.S3_REGION ?? "us-east-1"
const endpoint = process.env.S3_ENDPOINT || undefined
const maxBytes = Number(process.env.FILE_MAX_BYTES) || 25 * 1024 * 1024

// One client, created only when a bucket is configured. `forcePathStyle` keeps
// S3-compatible endpoints (MinIO/R2) working when set.
const s3 = bucket
  ? new S3Client({ region, endpoint, forcePathStyle: Boolean(endpoint) })
  : null

/** Lowercase extension including the dot, or "" — mirrors the client's `extname`. */
function extname(name: string): string {
  const dot = name.lastIndexOf(".")
  if (dot <= 0 || dot === name.length - 1) return ""
  const ext = name.slice(dot).toLowerCase()
  // Reject anything path-ish; keep it a plain suffix.
  return /^\.[a-z0-9]+$/.test(ext) ? ext : ""
}

/** A sane MIME token, or a safe default — the value is echoed back on download. */
function safeMime(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value && /^[\w.+-]+\/[\w.+-]+$/.test(value)
    ? value
    : "application/octet-stream"
}

/**
 * Content type inferred from a key's extension. Used to correct objects stored
 * as `application/octet-stream` (when the browser didn't set a type at upload)
 * so viewable types open inline rather than downloading. SVG is deliberately
 * absent — it's served as a download, since inline same-origin SVG can script.
 */
const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
}

/** Types safe to render inline on our own origin (no script execution). */
const INLINE_TYPES = new Set(Object.values(MIME_BY_EXT))

/** Resolves the type to serve: a real stored type wins; else infer from the key. */
function resolveType(key: string, stored: string | undefined): string {
  if (stored && stored !== "application/octet-stream") return stored
  const dot = key.lastIndexOf(".")
  const ext = dot >= 0 ? key.slice(dot).toLowerCase() : ""
  return MIME_BY_EXT[ext] ?? stored ?? "application/octet-stream"
}

/** Pulls the object key out of `/api/files/<key>`, guarding traversal. */
function keyFromPath(url: string): string | null {
  const raw = url.replace(/^\/api\/files\//, "").split("?")[0]
  const key = decodeURIComponent(raw)
  if (!key || key.includes("..")) return null
  return key
}

/** Buffers the request body, aborting past `limit` so a huge upload can't OOM. */
function collectBody(req: IncomingMessage, limit: number): Promise<Buffer | null> {
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

export function registerFileRoutes(app: FastifyInstance): void {
  // Raw binary uploads: no parsing, the handler reads the stream itself (same
  // no-op pattern as the JSON parser in index.ts).
  app.addContentTypeParser(
    "application/octet-stream",
    (_req, _payload, done) => done(null, undefined)
  )

  // Accepts the file bytes and streams them into S3. The original filename and
  // MIME ride in headers (the body is the raw file), so nothing about the object
  // is trusted from the client beyond its bytes.
  app.post("/api/files", async (req, reply) => {
    if (!isAuthed(req.raw)) return reply.code(401).send({ error: "Unauthorized" })
    if (!s3 || !bucket)
      return reply.code(503).send({ error: "File storage not configured" })

    const nameHeader = req.headers["x-file-name"]
    const name = decodeURIComponent(
      Array.isArray(nameHeader) ? nameHeader[0] : (nameHeader ?? "file")
    )
    const mime = safeMime(req.headers["x-file-mime"])

    const body = await collectBody(req.raw, maxBytes)
    if (!body) return reply.code(413).send({ error: "File too large" })
    if (body.length === 0) return reply.code(400).send({ error: "Empty file" })

    const key = `att/${randomUUID()}${extname(name)}`
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: mime,
        ContentLength: body.length,
      })
    )
    return reply.send({ key, mime, size: body.length })
  })

  // Streams the object back through the server. Proxying (rather than
  // redirecting to a presigned URL) keeps every browser request on this origin —
  // the bucket URL is never exposed and reads need no S3 CORS.
  app.get("/api/files/*", async (req, reply) => {
    if (!isAuthed(req.raw)) return reply.code(401).send({ error: "Unauthorized" })
    if (!s3 || !bucket)
      return reply.code(503).send({ error: "File storage not configured" })

    const key = keyFromPath(req.url)
    if (!key) return reply.code(400).send({ error: "Bad key" })

    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const type = resolveType(key, obj.ContentType)
      reply.header("content-type", type)
      if (obj.ContentLength != null)
        reply.header("content-length", String(obj.ContentLength))
      // Never let the browser sniff a different type than we declare, and only
      // render known-safe types inline (PDFs, images, …) — everything else
      // downloads. Together these stop a same-origin script-injection via upload.
      reply.header("x-content-type-options", "nosniff")
      reply.header(
        "content-disposition",
        INLINE_TYPES.has(type) ? "inline" : "attachment"
      )
      // Same-origin, but the bytes are private — don't let shared caches hold them.
      reply.header("cache-control", "private, max-age=300")
      return reply.send(obj.Body as Readable)
    } catch {
      return reply.code(404).send({ error: "Not found" })
    }
  })

  app.delete("/api/files/*", async (req, reply) => {
    if (!isAuthed(req.raw)) return reply.code(401).send({ error: "Unauthorized" })
    if (!s3 || !bucket)
      return reply.code(503).send({ error: "File storage not configured" })

    const key = keyFromPath(req.url)
    if (!key) return reply.code(400).send({ error: "Bad key" })
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    return reply.send({ ok: true })
  })
}
