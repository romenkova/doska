/**
 * Content-type policy for served attachments.
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

/** A sane MIME token, or a safe default — echoed back to the client on upload. */
export function safeMime(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value && /^[\w.+-]+\/[\w.+-]+$/.test(value)
    ? value
    : "application/octet-stream"
}

/** Resolves the type to serve: a real stored type wins; else infer from the key. */
export function resolveType(key: string, stored: string | undefined): string {
  if (stored && stored !== "application/octet-stream") return stored
  const dot = key.lastIndexOf(".")
  const ext = dot >= 0 ? key.slice(dot).toLowerCase() : ""
  return MIME_BY_EXT[ext] ?? stored ?? "application/octet-stream"
}

/** How a resolved type should be delivered: inline only for known-safe types. */
export function dispositionFor(type: string): "inline" | "attachment" {
  return INLINE_TYPES.has(type) ? "inline" : "attachment"
}
