import type { Card, Column, Dashboard } from "@/lib/types"
import type { FrontmatterDoc } from "./frontmatter"

/**
 * Deck ⇄ filesystem mapping. Pure, platform-agnostic helpers that turn records
 * into `{ path, doc }` and back, and vice-versa. No IO here — the driver reads
 * the folder and calls these; the `fs-adapter` does the actual reads/writes.
 *
 * Layout (see the feature plan):
 *
 * ```
 * <Board Title>/
 *   _index.md            board (Dashboard) frontmatter
 *   <Column Title>/
 *     _index.md          column frontmatter
 *     <Card Title>.md    card frontmatter + body
 * ```
 *
 * `columnId`/`dashboardId` are **not** stored in frontmatter — they're implied by
 * the parent folder — so moving a file between folders in Finder moves the card.
 * `deletedAt` isn't stored either: a live record is a present file, a deleted one
 * is an absent file.
 */

/** Folder-level metadata file carrying a board's or column's frontmatter. */
export const INDEX_FILE = "_index.md"
export const MD_EXT = ".md"

/** Cap a single path segment so deep titles don't blow past filesystem limits. */
const MAX_SEGMENT = 120

/**
 * Path separators, characters illegal on Windows filesystems, and control
 * characters. Built from an explicit char list (no literal ranges) so there's no
 * chance of an accidental range like `a-z`. Hyphens and spaces are intentionally
 * absent — they're valid and readable, and stay in the title.
 */
const ILLEGAL_CHARS = ['<', '>', ':', '"', '|', '?', '*', '/', '\\']
const ILLEGAL = new RegExp(
  `[${ILLEGAL_CHARS.map((c) => `\\${c}`).join("")}\\u0000-\\u001f]`,
  "g"
)

/**
 * Turns an arbitrary title into a safe single path segment (no extension):
 * strips illegal characters, collapses whitespace, trims trailing dots/spaces
 * (Windows), caps the length, and falls back to `Untitled` when nothing's left.
 */
export function sanitizeSegment(title: string): string {
  const cleaned = title
    .replace(ILLEGAL, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, MAX_SEGMENT)
    .trim()
  return cleaned || "Untitled"
}

/**
 * Picks a unique segment given the names already taken in the same folder
 * (compared case-insensitively, since macOS/Windows filesystems are). Appends
 * ` (2)`, ` (3)`, … until free. `taken` should hold base names without the
 * `.md` extension, lowercased; `_index` is always reserved for folder metadata.
 */
export function uniqueSegment(desired: string, taken: Set<string>): string {
  const reserved = (name: string) =>
    name.toLowerCase() === "_index" || taken.has(name.toLowerCase())

  if (!reserved(desired)) return desired
  for (let n = 2; ; n++) {
    const candidate = `${desired} (${n})`
    if (!reserved(candidate)) return candidate
  }
}

// ---------------------------------------------------------------------------
// Record → document
// ---------------------------------------------------------------------------

/** A card's on-disk document: frontmatter fields + the markdown body. */
export function cardToDoc(card: Card): FrontmatterDoc {
  return {
    data: {
      id: card.id,
      title: card.title,
      position: card.position,
      deadline: card.deadline ?? undefined,
      updatedAt: card.updatedAt,
    },
    body: card.body,
  }
}

/** A column's `_index.md` document. Columns have no body. */
export function columnToDoc(column: Column): FrontmatterDoc {
  return {
    data: {
      id: column.id,
      title: column.title,
      position: column.position,
      collapsed: column.collapsed || undefined,
      updatedAt: column.updatedAt,
    },
    body: "",
  }
}

/** A board's `_index.md` document. Boards have no body. */
export function boardToDoc(board: Dashboard): FrontmatterDoc {
  return {
    data: {
      id: board.id,
      title: board.title,
      position: board.position,
      updatedAt: board.updatedAt,
    },
    body: "",
  }
}

// ---------------------------------------------------------------------------
// Document → record
// ---------------------------------------------------------------------------

/** Context the folder layout supplies that isn't in the frontmatter itself. */
export interface DocContext {
  /** Stable id (from frontmatter, or freshly minted when adopting a file). */
  id: string
  /** File mtime in ms — the LWW clock for externally-edited files. */
  mtimeMs: number
}

/**
 * The effective LWW clock for a scanned file: the later of the app's own
 * `updatedAt` (if the frontmatter carries one) and the file's mtime. External
 * editors don't bump `updatedAt`, so their edits are recognized via mtime.
 */
function effectiveUpdatedAt(
  data: Record<string, unknown>,
  mtimeMs: number
): number {
  const stamped = typeof data.updatedAt === "number" ? data.updatedAt : 0
  return Math.max(stamped, Math.floor(mtimeMs))
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

/** Reconstructs a live Card from a scanned file. `columnId` comes from the folder. */
export function docToCard(
  doc: FrontmatterDoc,
  columnId: string,
  ctx: DocContext
): Card {
  const { data } = doc
  return {
    id: ctx.id,
    title: str(data.title, "Untitled"),
    body: doc.body,
    position: str(data.position),
    columnId,
    deadline: typeof data.deadline === "string" ? data.deadline : null,
    updatedAt: effectiveUpdatedAt(data, ctx.mtimeMs),
    deletedAt: null,
  }
}

/** Reconstructs a live Column from a scanned `_index.md`. */
export function docToColumn(
  doc: FrontmatterDoc,
  dashboardId: string,
  ctx: DocContext
): Column {
  const { data } = doc
  return {
    id: ctx.id,
    title: str(data.title, "Untitled"),
    position: str(data.position),
    dashboardId,
    collapsed: data.collapsed === true,
    updatedAt: effectiveUpdatedAt(data, ctx.mtimeMs),
    deletedAt: null,
  }
}

/** Reconstructs a live board (Dashboard) from a scanned `_index.md`. */
export function docToBoard(doc: FrontmatterDoc, ctx: DocContext): Dashboard {
  const { data } = doc
  return {
    id: ctx.id,
    title: str(data.title, "Untitled"),
    position: str(data.position),
    updatedAt: effectiveUpdatedAt(data, ctx.mtimeMs),
    deletedAt: null,
  }
}
