import { generateKeyBetween } from "fractional-indexing"
import type { Change, DashboardChange } from "@doska/contract"
import type { Card, Column, Dashboard } from "@/lib/types"
import { CARDS, COLUMNS, DASHBOARDS } from "../../constants"
import { idb } from "../../db/idb"
import * as fs from "./fs-adapter"
import {
  parseFrontmatter,
  stringifyFrontmatter,
  type FrontmatterDoc,
} from "./frontmatter"
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
import {
  dropSubtree,
  loadPathIndex,
  reprefix,
  savePathIndex,
  splitRel,
  storeOf,
  type PathMap,
} from "./path-index"

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/** The per-card attachment sidecar folder for a card's `.md` rel path. */
export function assetsRel(cardRel: string): string {
  return cardRel.replace(/\.md$/, ".assets")
}

const EMPTY_DOC: FrontmatterDoc = { data: {}, body: "" }

/**
 * Filesystem mirror of the board tree, rooted at an absolute folder path. Owns
 * the `id → path` index and does all record⇄file IO. Paths are POSIX-relative to
 * the root everywhere except the `fs-adapter` boundary.
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

  // Writes

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

  // Skips rewriting when already present: an unconditional write would bump mtime
  // every push and, with the folder watcher on, loop forever. Renames go through
  // the list channel's write(), not here.
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
      await this.unlink(old)
      return null
    }

    const rel = await this.resolveRel("", old, board.title, "")
    await this.placeFolder(old, rel)
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
      await this.unlink(old)
      return
    }

    const boardRel = this.index[column.dashboardId]
    if (!boardRel) return // Board folder not materialized yet; retry next tick.

    const rel = await this.resolveRel(boardRel, old, column.title, "")
    await this.placeFolder(old, rel)
    await fs.writeTextFile(
      await this.abs(`${rel}/${INDEX_FILE}`),
      stringifyFrontmatter(columnToDoc(column).data, "")
    )
    this.index[column.id] = rel
  }

  private async writeCard(card: Card): Promise<void> {
    const old = this.index[card.id]
    if (card.deletedAt != null) {
      if (old) await fs.remove(await this.abs(assetsRel(old)))
      await this.unlink(old)
      return
    }

    const columnRel = this.index[card.columnId]
    if (!columnRel) return // Column folder not materialized yet; retry next tick.

    const rel = await this.resolveRel(columnRel, old, card.title, MD_EXT)
    if (old && old !== rel) {
      await fs.remove(await this.abs(old))
      // Keep attachments beside the card: move its `.assets` sidecar too.
      if (await fs.exists(await this.abs(assetsRel(old))))
        await fs.rename(await this.abs(assetsRel(old)), await this.abs(assetsRel(rel)))
    }
    const doc = cardToDoc(card)
    await fs.writeTextFile(
      await this.abs(rel),
      stringifyFrontmatter(doc.data, doc.body)
    )
    this.index[card.id] = rel
  }

  // Removes the file/folder at `old` and prunes its index entries. Safe when
  // `old` is undefined (record was never written) or a `.md` file (no subtree).
  private async unlink(old: string | undefined): Promise<void> {
    if (!old) return
    await fs.remove(await this.abs(old))
    dropSubtree(this.index, old)
  }

  // The unique rel path for a record: a title-derived, collision-free segment
  // under `parentRel`. `ext` is "" for folders, `.md` for cards.
  private async resolveRel(
    parentRel: string,
    old: string | undefined,
    title: string,
    ext: string
  ): Promise<string> {
    const base = sanitizeSegment(title)
    const oldBase = old ? splitRel(old).base.replace(/\.md$/, "") : undefined
    const name = uniqueSegment(base, await this.takenIn(parentRel, oldBase))
    return parentRel ? `${parentRel}/${name}${ext}` : `${name}${ext}`
  }

  // Moves a folder to `rel` (renaming its index subtree) or creates it fresh.
  private async placeFolder(
    old: string | undefined,
    rel: string
  ): Promise<void> {
    if (old && old !== rel) {
      await fs.rename(await this.abs(old), await this.abs(rel))
      reprefix(this.index, old, rel)
    } else {
      await fs.mkdir(await this.abs(rel))
    }
  }

  // Scans

  private async readDoc(rel: string): Promise<FrontmatterDoc | null> {
    try {
      const text = await fs.readTextFile(await this.abs(rel))
      return parseFrontmatter(text)
    } catch {
      return null
    }
  }

  // Resolves a scanned file's stable id (adopting one when absent), records it in
  // the index + `seen`, and reports whether it changed since the last cursor.
  private async identify(
    doc: FrontmatterDoc,
    entityRel: string,
    statRel: string,
    prefix: string,
    seen: Set<string>,
    since: number
  ): Promise<{ id: string; mtime: number; adopted: boolean; changed: boolean }> {
    const rawId = typeof doc.data.id === "string" ? doc.data.id : ""
    const id = rawId || newId(prefix)
    const mtime = await this.safeMtime(statRel)
    const adopted = !rawId
    const known = this.index[id] === entityRel

    this.index[id] = entityRel
    seen.add(id)

    return { id, mtime, adopted, changed: mtime > since || adopted || !known }
  }

  // Top-level folders as boards: surfaces external edits (mtime), adopts folders
  // lacking an id, tombstones tracked boards whose folder is gone.
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
      const doc = (await this.readDoc(indexRel)) ?? EMPTY_DOC
      const { id, mtime, adopted, changed } = await this.identify(
        doc,
        rel,
        indexRel,
        "board",
        seen,
        since
      )

      if (changed) {
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

  // One board's subtree: columns (`_index.md`) and cards (`*.md`), same handling
  // as scanBoards.
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

  private async scanColumn(
    columnRel: string,
    boardId: string,
    since: number,
    seen: Set<string>,
    out: Change[]
  ): Promise<string | null> {
    const indexRel = `${columnRel}/${INDEX_FILE}`
    const doc = (await this.readDoc(indexRel)) ?? EMPTY_DOC
    const { id, mtime, adopted, changed } = await this.identify(
      doc,
      columnRel,
      indexRel,
      "col",
      seen,
      since
    )

    if (changed) {
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

      const { id, mtime, adopted, changed } = await this.identify(
        doc,
        rel,
        rel,
        "card",
        seen,
        since
      )

      const hasPosition = typeof doc.data.position === "string" && doc.data.position
      if (hasPosition) lastPosition = doc.data.position as string

      if (changed) {
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

  // Tombstones tracked ids not seen in a scan (deleted on disk): rebuilds the
  // record from IndexedDB with a fresh delete clock. Ids gone from IndexedDB are
  // just dropped from the index.
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

      const store = storeOf(rel)
      const existing = await idb.get<Card | Column | Dashboard>(store, id)
      delete this.index[id]
      if (!existing) continue

      const record = { ...existing, deletedAt: now, updatedAt: now }
      out.push({ store, record } as Change | DashboardChange)
    }
    return out
  }
}
