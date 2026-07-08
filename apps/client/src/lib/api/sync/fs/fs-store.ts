import { generateKeyBetween } from "fractional-indexing"
import type { Change, DashboardChange } from "@doska/contract"
import type { Card, Column, Dashboard } from "@/lib/types"
import { CARDS, COLUMNS, DASHBOARDS } from "../../constants"
import { idb } from "../../db/idb"
import * as fs from "./fs-adapter"
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter"
import {
  INDEX_FILE,
  MD_EXT,
  boardToDoc,
  cardToDoc,
  columnToDoc,
  docToBoard,
  docToCard,
  docToColumn,
  sanitizeSegment,
  uniqueSegment,
} from "./mapping"
import { loadPathIndex, savePathIndex, type PathMap } from "./path-index"

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/** Split a POSIX rel path into `{ parent, base }` (parent is "" at the root). */
function splitRel(rel: string): { parent: string; base: string } {
  const slash = rel.lastIndexOf("/")
  return slash === -1
    ? { parent: "", base: rel }
    : { parent: rel.slice(0, slash), base: rel.slice(slash + 1) }
}

/**
 * The filesystem mirror of the board tree, rooted at an absolute folder path.
 * Owns the `id → path` index and does all record⇄file IO. Both filesystem
 * drivers (board + dashboard-list) construct one per push: writes flush dirty
 * records to disk, scans surface external edits/adoptions/deletions. Paths are
 * POSIX-relative to the root everywhere except the `fs-adapter` boundary.
 */
export class FsStore {
  private index: PathMap = {}
  private loaded = false
  private readonly root: string

  constructor(root: string) {
    this.root = root
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    this.index = await loadPathIndex()
    this.loaded = true
  }

  /** Persists the path index after a batch of writes/scans. */
  async flush(): Promise<void> {
    await savePathIndex(this.index)
  }

  private abs(rel: string): Promise<string> {
    return fs.join(this.root, ...rel.split("/"))
  }

  /** Base names (lowercased, no `.md`) already taken in `parentRel`, minus `self`. */
  private async takenIn(parentRel: string, self?: string): Promise<Set<string>> {
    const taken = new Set<string>()
    try {
      const entries = await fs.readDir(await this.abs(parentRel || "."))
      for (const e of entries) {
        const name = e.name.endsWith(MD_EXT)
          ? e.name.slice(0, -MD_EXT.length)
          : e.name
        if (self && name.toLowerCase() === self.toLowerCase()) continue
        taken.add(name.toLowerCase())
      }
    } catch {
      // Missing directory — nothing taken yet.
    }
    return taken
  }

  /** Rewrites every index entry under `oldPrefix` to sit under `newPrefix`. */
  private reprefix(oldPrefix: string, newPrefix: string): void {
    if (oldPrefix === newPrefix) return
    for (const [id, rel] of Object.entries(this.index)) {
      if (rel === oldPrefix) this.index[id] = newPrefix
      else if (rel.startsWith(oldPrefix + "/"))
        this.index[id] = newPrefix + rel.slice(oldPrefix.length)
    }
  }

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------

  /** Dispatches a dirty change to the matching writer. */
  async write(change: Change | DashboardChange): Promise<void> {
    await this.ensureLoaded()
    switch (change.store) {
      case DASHBOARDS:
        await this.writeBoard(change.record)
        return
      case COLUMNS:
        await this.writeColumn(change.record)
        return
      case CARDS:
        await this.writeCard(change.record)
        return
    }
  }

  /**
   * Ensures a board's folder + `_index.md` exist so its columns/cards have a
   * home, without rewriting when already present — an unconditional write would
   * bump mtime every push and, with the folder watcher on, loop forever. Board
   * renames are handled by the list channel's {@link write}, not here.
   */
  async ensureBoardFolder(board: Dashboard): Promise<string | null> {
    await this.ensureLoaded()
    if (board.deletedAt != null) return null
    const existing = this.index[board.id]
    if (existing && (await fs.exists(await this.abs(`${existing}/${INDEX_FILE}`))))
      return existing
    return this.writeBoard(board)
  }

  private async writeBoard(board: Dashboard): Promise<string | null> {
    const old = this.index[board.id]

    if (board.deletedAt != null) {
      if (old) {
        await fs.remove(await this.abs(old))
        this.dropSubtree(old)
      }
      return null
    }

    const base = sanitizeSegment(board.title)
    const oldBase = old ? splitRel(old).base : undefined
    const name = uniqueSegment(base, await this.takenIn("", oldBase))
    const rel = name

    if (old && old !== rel) {
      await fs.rename(await this.abs(old), await this.abs(rel))
      this.reprefix(old, rel)
    } else {
      await fs.mkdir(await this.abs(rel))
    }

    await fs.writeTextFile(
      await this.abs(`${rel}/${INDEX_FILE}`),
      stringifyFrontmatter(boardToDoc(board).data, "")
    )
    this.index[board.id] = rel
    return rel
  }

  private async writeColumn(column: Column): Promise<void> {
    const old = this.index[column.id]

    if (column.deletedAt != null) {
      if (old) {
        await fs.remove(await this.abs(old))
        this.dropSubtree(old)
      }
      return
    }

    const boardRel = this.index[column.dashboardId]
    if (!boardRel) return // Board folder not materialized yet; retry next tick.

    const base = sanitizeSegment(column.title)
    const oldBase = old ? splitRel(old).base : undefined
    const name = uniqueSegment(base, await this.takenIn(boardRel, oldBase))
    const rel = `${boardRel}/${name}`

    if (old && old !== rel) {
      await fs.rename(await this.abs(old), await this.abs(rel))
      this.reprefix(old, rel)
    } else {
      await fs.mkdir(await this.abs(rel))
    }

    await fs.writeTextFile(
      await this.abs(`${rel}/${INDEX_FILE}`),
      stringifyFrontmatter(columnToDoc(column).data, "")
    )
    this.index[column.id] = rel
  }

  private async writeCard(card: Card): Promise<void> {
    const old = this.index[card.id]

    if (card.deletedAt != null) {
      if (old) {
        await fs.remove(await this.abs(old))
        delete this.index[card.id]
      }
      return
    }

    const columnRel = this.index[card.columnId]
    if (!columnRel) return // Column folder not materialized yet; retry next tick.

    const base = sanitizeSegment(card.title)
    const oldBase = old ? splitRel(old).base.replace(/\.md$/, "") : undefined
    const name = uniqueSegment(base, await this.takenIn(columnRel, oldBase))
    const rel = `${columnRel}/${name}${MD_EXT}`

    const doc = cardToDoc(card)
    if (old && old !== rel) await fs.remove(await this.abs(old))
    await fs.writeTextFile(await this.abs(rel), stringifyFrontmatter(doc.data, doc.body))
    this.index[card.id] = rel
  }

  /** Removes every index entry at or under `prefix`. */
  private dropSubtree(prefix: string): void {
    for (const [id, rel] of Object.entries(this.index)) {
      if (rel === prefix || rel.startsWith(prefix + "/")) delete this.index[id]
    }
  }

  // -------------------------------------------------------------------------
  // Scans
  // -------------------------------------------------------------------------

  /** Reads and parses a file; returns null when it's missing/unreadable. */
  private async readDoc(rel: string) {
    try {
      const text = await fs.readTextFile(await this.abs(rel))
      return parseFrontmatter(text)
    } catch {
      return null
    }
  }

  /**
   * Scans the top-level folders as boards: surfaces external edits (mtime),
   * adopts folders lacking an id, and tombstones tracked boards whose folder is
   * gone. Emits changes with LWW-ready `updatedAt`.
   */
  async scanBoards(since: number): Promise<DashboardChange[]> {
    await this.ensureLoaded()
    const changes: DashboardChange[] = []
    const seen = new Set<string>()

    let entries: fs.DirEntry[]
    try {
      entries = await fs.readDir(this.root)
    } catch {
      return changes
    }

    for (const entry of entries) {
      if (!entry.isDirectory) continue
      const rel = entry.name
      const indexRel = `${rel}/${INDEX_FILE}`
      const doc = (await this.readDoc(indexRel)) ?? { data: {}, body: "" }

      const rawId = typeof doc.data.id === "string" ? doc.data.id : ""
      const id = rawId || newId("board")
      const mtime = await this.safeMtime(indexRel)
      const adopted = !rawId
      const known = this.index[id] === rel

      this.index[id] = rel
      seen.add(id)

      if (mtime > since || adopted || !known) {
        const board = docToBoard(doc, { id, mtimeMs: mtime })
        if (adopted)
          await fs.writeTextFile(
            await this.abs(indexRel),
            stringifyFrontmatter(boardToDoc(board).data, "")
          )
        changes.push({ store: DASHBOARDS, record: board })
      }
    }

    const gone = await this.tombstoneMissing(seen, "board", (r) => !r.includes("/"))
    changes.push(...(gone as DashboardChange[]))
    return changes
  }

  /**
   * Scans one board's subtree: its columns (`_index.md`) and cards (`*.md`).
   * Same external-edit/adoption/deletion handling as {@link scanBoards}.
   */
  async scanBoard(boardId: string, since: number): Promise<Change[]> {
    await this.ensureLoaded()
    const changes: Change[] = []
    const boardRel = this.index[boardId]
    if (!boardRel) return changes // Board folder not materialized yet.

    const seen = new Set<string>()

    let columnDirs: fs.DirEntry[]
    try {
      columnDirs = await fs.readDir(await this.abs(boardRel))
    } catch {
      return changes
    }

    for (const dir of columnDirs) {
      if (!dir.isDirectory) continue
      const columnRel = `${boardRel}/${dir.name}`
      const columnId = await this.scanColumn(columnRel, boardId, since, seen, changes)
      if (columnId) await this.scanCards(columnRel, columnId, since, seen, changes)
    }

    const gone = await this.tombstoneMissing(
      seen,
      "any",
      (rel) => rel.startsWith(boardRel + "/")
    )
    changes.push(...(gone as Change[]))
    return changes
  }

  /** Resolves/adopts a column from its `_index.md`; emits a change when relevant. */
  private async scanColumn(
    columnRel: string,
    boardId: string,
    since: number,
    seen: Set<string>,
    out: Change[]
  ): Promise<string | null> {
    const indexRel = `${columnRel}/${INDEX_FILE}`
    const doc = (await this.readDoc(indexRel)) ?? { data: {}, body: "" }
    const rawId = typeof doc.data.id === "string" ? doc.data.id : ""
    const id = rawId || newId("col")
    const mtime = await this.safeMtime(indexRel)
    const adopted = !rawId
    const known = this.index[id] === columnRel

    this.index[id] = columnRel
    seen.add(id)

    if (mtime > since || adopted || !known) {
      const column = docToColumn(doc, boardId, { id, mtimeMs: mtime })
      if (adopted)
        await fs.writeTextFile(
          await this.abs(indexRel),
          stringifyFrontmatter(columnToDoc(column).data, "")
        )
      out.push({ store: COLUMNS, record: column })
    }
    return id
  }

  /** Scans a column's card files, adopting/positioning as needed. */
  private async scanCards(
    columnRel: string,
    columnId: string,
    since: number,
    seen: Set<string>,
    out: Change[]
  ): Promise<void> {
    let files: fs.DirEntry[]
    try {
      files = await fs.readDir(await this.abs(columnRel))
    } catch {
      return
    }

    // Track the greatest position seen so adopted cards get distinct trailing keys.
    let lastPosition: string | null = null

    for (const file of files) {
      if (!file.isFile || !file.name.endsWith(MD_EXT)) continue
      if (file.name === INDEX_FILE) continue

      const rel = `${columnRel}/${file.name}`
      const doc = await this.readDoc(rel)
      if (!doc) continue

      const rawId = typeof doc.data.id === "string" ? doc.data.id : ""
      const id = rawId || newId("card")
      const mtime = await this.safeMtime(rel)
      const adopted = !rawId
      const known = this.index[id] === rel

      this.index[id] = rel
      seen.add(id)

      const hasPosition = typeof doc.data.position === "string" && doc.data.position
      if (hasPosition) lastPosition = doc.data.position as string

      if (mtime > since || adopted || !known) {
        const card = docToCard(doc, columnId, { id, mtimeMs: mtime })
        if (!hasPosition) {
          lastPosition = generateKeyBetween(lastPosition, null)
          card.position = lastPosition
        }
        if (adopted || !hasPosition)
          await fs.writeTextFile(
            await this.abs(rel),
            stringifyFrontmatter(cardToDoc(card).data, card.body)
          )
        out.push({ store: CARDS, record: card })
      }
    }
  }

  private async safeMtime(rel: string): Promise<number> {
    try {
      return await fs.mtimeMs(await this.abs(rel))
    } catch {
      return 0
    }
  }

  /**
   * Builds tombstone changes for tracked ids not seen in a scan (deleted on
   * disk). Rebuilds the record from IndexedDB and stamps a fresh delete clock;
   * ids no longer in IndexedDB are just dropped from the index.
   */
  private async tombstoneMissing(
    seen: Set<string>,
    kind: "board" | "any",
    inScope: (rel: string) => boolean
  ): Promise<Array<Change | DashboardChange>> {
    const out: Array<Change | DashboardChange> = []
    const now = Date.now()

    for (const [id, rel] of Object.entries(this.index)) {
      if (seen.has(id) || !inScope(rel)) continue
      // Skip the board's own entry when scanning that board's subtree.
      if (kind === "board" && rel.includes("/")) continue

      const store = this.storeOf(rel)
      const existing = await idb.get<Card | Column | Dashboard>(store, id)
      delete this.index[id]
      if (!existing) continue

      const record = { ...existing, deletedAt: now, updatedAt: now }
      out.push({ store, record } as Change | DashboardChange)
    }
    return out
  }

  /** Infers the store a rel path belongs to: `.md` file → card, else folder. */
  private storeOf(rel: string): typeof CARDS | typeof COLUMNS | typeof DASHBOARDS {
    if (rel.endsWith(MD_EXT)) return CARDS
    return rel.includes("/") ? COLUMNS : DASHBOARDS
  }
}
