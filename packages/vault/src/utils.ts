export function snakeName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .slice(0, 60)
    .replace(/^_+|_+$/g, "")
}

/**
 * A folder name read back as a column title: `in_progress` is "In progress".
 */
export function titleOf(name: string): string {
  const words = name.replace(/[_\s]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** The folder a file sits in. */
export function dirOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"))
}

/** A file's name without its `.md`. */
export function stemOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "")
}

export async function hashOf(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}
