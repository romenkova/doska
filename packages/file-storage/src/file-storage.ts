/**
 * Blob storage behind a stable `key`, one implementation per sync backend
 * (see `adapters/`). Domain-agnostic: it moves bytes, it knows nothing about
 * cards or sync config. The `scope` threaded through every method is an opaque
 * grouping id (the app passes a card id) — the S3 adapter folds it into a key
 * prefix, the filesystem adapter uses it to locate a per-scope sidecar folder.
 */

/** Bytes plus the metadata needed to store and later serve them. */
export interface FileInput {
  /** Original filename — used only to derive an extension; not the stored key. */
  name: string
  mime: string
  bytes: Blob
}

/** A stored blob's stable handle. `key` is backend-specific and opaque to callers. */
export interface StoredFile {
  key: string
  mime: string
  size: number
}

export interface FileStorage {
  /** Stores `input` and returns its stable key. */
  put(scope: string, input: FileInput): Promise<StoredFile>
  /** Reads the bytes back — powers thumbnails and cross-backend migration. */
  get(scope: string, key: string): Promise<Blob>
  /** A URL usable in `<img>`/`<a>` (an app route for S3, an asset URL for FS). */
  url(scope: string, key: string): Promise<string>
  /** Deletes the blob; a missing blob is not an error. */
  remove(scope: string, key: string): Promise<void>
}

/** Lowercase extension including the dot (`".png"`), or `""` when absent. */
export function extname(name: string): string {
  const dot = name.lastIndexOf(".")
  if (dot <= 0 || dot === name.length - 1) return ""
  return name.slice(dot).toLowerCase()
}
