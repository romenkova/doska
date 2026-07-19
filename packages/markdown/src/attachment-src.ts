// `attachment:<key>` image refs point at a card attachment. The real URL is
// resolved on the client at render time, so only the stable key is stored.
const PREFIX = "attachment:"

export function toAttachmentSrc(key: string): string {
  return PREFIX + key
}

/** The attachment key if `src` is an attachment ref, otherwise null. */
export function attachmentKeyFromSrc(src: unknown): string | null {
  return typeof src === "string" && src.startsWith(PREFIX)
    ? src.slice(PREFIX.length)
    : null
}
