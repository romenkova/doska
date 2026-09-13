import type { Card, Column } from "@doska/contract"
import type { VaultFs } from "../src/column-folder"
import type { VaultBoard, VaultFiles } from "../src/vault"

/** Files keyed by path, folders by their own. Renaming one moves both. */
export class MemoryFs implements VaultFs {
  readonly files = new Map<string, string>()
  private readonly dirs = new Set<string>()
  private listener: (() => void) | null = null

  read(path: string) {
    return Promise.resolve(this.files.get(path) ?? null)
  }

  write(path: string, content: string) {
    this.files.set(path, content)
    return Promise.resolve()
  }

  writeBytes(path: string, bytes: Uint8Array) {
    this.files.set(path, `bytes:${bytes.length}`)
    return Promise.resolve()
  }

  mkdir(path: string) {
    this.dirs.add(path)
    return Promise.resolve()
  }

  rename(from: string, to: string) {
    const content = this.files.get(from)
    if (content !== undefined) {
      this.files.delete(from)
      this.files.set(to, content)
    }
    if (this.dirs.delete(from)) {
      this.dirs.add(to)
      for (const [path, text] of [...this.files]) {
        if (!path.startsWith(`${from}/`)) continue
        this.files.delete(path)
        this.files.set(`${to}${path.slice(from.length)}`, text)
      }
    }
    return Promise.resolve()
  }

  remove(path: string) {
    this.files.delete(path)
    this.dirs.delete(path)
    return Promise.resolve()
  }

  readDir(path: string) {
    if (!this.dirs.has(path)) return Promise.resolve(null)
    const names: string[] = []
    for (const file of this.files.keys()) {
      if (file.startsWith(`${path}/`)) names.push(file.slice(path.length + 1))
    }
    return Promise.resolve(names.filter((name) => !name.includes("/")))
  }

  readDirs(path: string) {
    if (!this.dirs.has(path)) return Promise.resolve(null)
    const names: string[] = []
    for (const dir of this.dirs) {
      if (!dir.startsWith(`${path}/`)) continue
      const name = dir.slice(path.length + 1)
      if (!name.includes("/")) names.push(name)
    }
    return Promise.resolve(names)
  }

  watch(_path: string, listener: () => void) {
    this.listener = listener
    return Promise.resolve(() => {
      this.listener = null
    })
  }

  /** The root gone from under the vault: an unmounted drive, a moved folder. */
  wipe() {
    this.files.clear()
    this.dirs.clear()
  }

  /** Pretends the folder changed, the way the real watcher would. */
  touch() {
    this.listener?.()
  }
}

/** Attachment bytes, and a count of how often each key was fetched. */
export class FakeFiles implements VaultFiles {
  readonly fetched: string[] = []
  failing = false

  get(_cardId: string, key: string) {
    this.fetched.push(key)
    if (this.failing) return Promise.reject(new Error("signed out"))
    return Promise.resolve(new Uint8Array([1, 2, 3]))
  }
}

let seq = 0

export function makeCard(fields: Partial<Card> & { columnId: string }): Card {
  return {
    id: `card-${++seq}`,
    title: "",
    body: "",
    position: "a0",
    number: null,
    deadline: null,
    priority: "",
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    stamps: {},
    bodyConflict: null,
    ...fields,
  }
}

export function makeColumn(id: string, title: string): Column {
  return {
    id,
    title,
    position: "a0",
    dashboardId: "board-1",
    collapsed: false,
    color: "",
    done: false,
    updatedAt: 0,
    deletedAt: null,
    stamps: {},
  }
}

export class FakeBoard implements VaultBoard {
  readonly cardsById = new Map<string, Card>()
  readonly trashed = new Map<string, Card>()
  readonly deleteCalls: string[] = []
  readonly droppedCols: string[] = []

  private readonly cols: Column[]

  constructor(cols: Column[]) {
    this.cols = cols.map((col) => ({ ...col }))
  }

  columns(): Column[] {
    return this.cols
  }

  column(id: string): Column | undefined {
    return this.cols.find((col) => col.id === id)
  }

  add(card: Card) {
    this.cardsById.set(card.id, card)
    return card
  }

  load() {
    return Promise.resolve({
      columns: this.cols,
      cards: [...this.cardsById.values()],
    })
  }

  deleted() {
    return Promise.resolve({
      columns: [...this.droppedCols],
      cards: [...this.trashed.keys()],
    })
  }

  createColumn(title: string) {
    const column = makeColumn(`col-${++seq}`, title)
    this.cols.push(column)
    return Promise.resolve(column.id)
  }

  createCard(columnId: string) {
    const card = makeCard({ columnId })
    this.cardsById.set(card.id, card)
    return Promise.resolve(card.id)
  }

  updateCard(id: string, patch: Partial<Card>) {
    const card = this.cardsById.get(id)
    if (card) this.cardsById.set(id, { ...card, ...patch })
    return Promise.resolve()
  }

  renameColumn(id: string, title: string) {
    const column = this.column(id)
    if (column) column.title = title
    return Promise.resolve()
  }

  moveCardToColumn(id: string, columnId: string) {
    const card = this.cardsById.get(id)
    if (card) this.cardsById.set(id, { ...card, columnId })
    return Promise.resolve()
  }

  deleteCard(id: string) {
    const card = this.cardsById.get(id)
    if (card) this.trashed.set(id, card)
    this.deleteCalls.push(id)
    this.cardsById.delete(id)
    return Promise.resolve()
  }

  addColumn(column: Column) {
    this.cols.push({ ...column })
  }

  /** Drops a column and its cards, the way the board's delete does. */
  deleteColumn(id: string) {
    const at = this.cols.findIndex((col) => col.id === id)
    if (at !== -1) this.cols.splice(at, 1)
    this.droppedCols.push(id)
    for (const card of [...this.cardsById.values()]) {
      if (card.columnId === id) void this.deleteCard(card.id)
    }
  }

  /** Brings a column back with the cards its delete took, the way restore does. */
  restoreColumn(column: Column) {
    this.cols.push({ ...column })
    const at = this.droppedCols.indexOf(column.id)
    if (at !== -1) this.droppedCols.splice(at, 1)
    for (const [id, card] of [...this.trashed]) {
      if (card.columnId !== column.id) continue
      this.trashed.delete(id)
      this.cardsById.set(id, card)
    }
  }

  restoreCard(id: string) {
    const card = this.trashed.get(id)
    if (card) {
      this.trashed.delete(id)
      this.cardsById.set(id, card)
    }
    return Promise.resolve()
  }
}
