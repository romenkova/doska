import type { Card, Column, Dashboard } from "@/lib/types"
import type { FrontmatterDoc } from "./frontmatter"

/**
 * Deck ⇄ filesystem mapping. Layout:
 *
 * ```
 * <Board Title>/
 *   _index.md            board frontmatter
 *   <Column Title>/
 *     _index.md          column frontmatter
 *     <Card Title>.md    card frontmatter + body
 * ```
 *
 * `columnId`/`dashboardId` are implied by the parent folder, not stored — so
 * moving a file in Finder moves the card. A deleted record is an absent file.
 */

export const INDEX_FILE = "_index.md"
export const MD_EXT = ".md"

const MAX_SEGMENT = 120

// Explicit char list (no literal ranges) to avoid an accidental range like a-z.
const ILLEGAL_CHARS = ['<', '>', ':', '"', '|', '?', '*', '/', '\\']
const ILLEGAL = new RegExp(
  `[${ILLEGAL_CHARS.map((c) => `\\${c}`).join("")}\\u0000-\\u001f]`,
  "g"
)

/** Title → safe single path segment; falls back to `Untitled` when empty. */
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
 * Unique segment within a folder, appending ` (2)`, ` (3)`, … until free.
 * Compared case-insensitively since macOS/Windows filesystems are. `taken` holds
 * lowercased base names without `.md`; `_index` is reserved for folder metadata.
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

export interface DocContext {
  /** Stable id (from frontmatter, or freshly minted when adopting a file). */
  id: string
  /** File mtime in ms — the LWW clock for externally-edited files. */
  mtimeMs: number
}

// Later of frontmatter `updatedAt` and mtime: external editors don't bump
// `updatedAt`, so their edits are only seen via mtime.
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
