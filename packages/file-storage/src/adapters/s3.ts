import type { FileInput, FileStorage, StoredFile } from "../file-storage"

/**
 * Platform hooks the adapter needs, injected so the package stays free of the
 * app's `runtime` module: `fetch` is the app's `appFetch` (native HTTP on
 * desktop, so session cookies ride along), `apiUrl` turns a path into an
 * absolute URL against the configured server.
 */
export interface S3Deps {
  fetch: typeof fetch
  apiUrl: (path: string) => string
}

interface UploadResponse {
  key: string
  mime: string
  size: number
}

/**
 * S3-backed storage for server-sync mode. The browser never talks to S3: bytes
 * are POSTed to this server ({@link put}) and proxied back on read (the
 * `/api/files/<key>` route), so the bucket stays private and off the browser's
 * network path. `scope` is unused — S3 keys are already globally unique.
 */
export class S3FileStorage implements FileStorage {
  private readonly deps: S3Deps

  constructor(deps: S3Deps) {
    this.deps = deps
  }

  private fileUrl(key: string): string {
    return this.deps.apiUrl(`/api/files/${encodeURIComponent(key)}`)
  }

  async put(_scope: string, input: FileInput): Promise<StoredFile> {
    // Raw body; filename and MIME travel in headers so the server can name and
    // serve the object without trusting a client-built key.
    const res = await this.deps.fetch(this.deps.apiUrl("/api/files"), {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-file-name": encodeURIComponent(input.name),
        "x-file-mime": input.mime,
      },
      body: input.bytes,
    })
    if (!res.ok) throw new Error(`upload failed: ${res.status}`)
    const stored = (await res.json()) as UploadResponse
    return { key: stored.key, mime: stored.mime, size: stored.size }
  }

  async get(_scope: string, key: string): Promise<Blob> {
    const res = await this.deps.fetch(this.fileUrl(key))
    if (!res.ok) throw new Error(`download failed: ${res.status}`)
    return res.blob()
  }

  // No fetch: an <img>/<a> follows the 302 to the presigned GET natively.
  url(_scope: string, key: string): Promise<string> {
    return Promise.resolve(this.fileUrl(key))
  }

  async remove(_scope: string, key: string): Promise<void> {
    await this.deps.fetch(this.fileUrl(key), { method: "DELETE" })
  }
}
