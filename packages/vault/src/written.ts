import type { VaultFs } from "./column-folder"
import { dirOf, hashOf } from "./utils"

const META = "_meta.json"

/** The entries of one `_meta.json` section, whatever else is in the file. */
function section(value: unknown): [string, Record<string, unknown>][] {
  if (typeof value !== "object" || value === null) return []
  return Object.entries(value).filter(
    ([, entry]) => typeof entry === "object" && entry !== null
  )
}

function sorted<T>(map: Map<string, T>): Record<string, T> {
  return Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b)))
}

/** `_meta.json` as it comes off disk, before any of it is trusted. */
interface Meta {
  board?: unknown
  cards?: unknown
  columns?: unknown
}

/** A file the vault wrote, as it wrote it. */
export interface WrittenFile {
  path: string
  hash: string
}

/** A column's folder, as the vault last left it. */
export interface WrittenFolder {
  /** The folder's name under the root, not its full path. */
  name: string
  /** The column's title when that name was chosen. */
  title: string
}

/**
 * What the vault last wrote per card, so its own writes don't read back as user
 * edits. Kept in `_meta.json` between runs.
 */
export class Written {
  private readonly fs: VaultFs
  private readonly path: string
  private readonly boardId: string
  private held: string | null = null
  private readonly entries = new Map<string, WrittenFile>()
  private readonly folders = new Map<string, WrittenFolder>()
  /** The last `_meta.json` on disk, so an unchanged pass doesn't rewrite it. */
  private saved = ""
  private loaded = false

  constructor(fs: VaultFs, root: string, boardId: string) {
    this.fs = fs
    this.path = `${root}/${META}`
    this.boardId = boardId
  }

  async owner(): Promise<string | null> {
    const meta = await this.read()
    return typeof meta?.board === "string" ? meta.board : null
  }

  claim(): void {
    this.held = this.boardId
  }

  [Symbol.iterator](): IterableIterator<[string, WrittenFile]> {
    return this.entries.entries()
  }

  values(): IterableIterator<WrittenFile> {
    return this.entries.values()
  }

  has(id: string): boolean {
    return this.entries.has(id)
  }

  get(id: string): WrittenFile | undefined {
    return this.entries.get(id)
  }

  async set(id: string, file: { path: string; text: string }): Promise<void> {
    this.entries.set(id, { path: file.path, hash: await hashOf(file.text) })
  }

  /** Whether `text` is what the vault last wrote for this card. */
  async wrote(id: string, text: string): Promise<boolean> {
    return this.entries.get(id)?.hash === (await hashOf(text))
  }

  delete(id: string): void {
    this.entries.delete(id)
  }

  folder(columnId: string): WrittenFolder | undefined {
    return this.folders.get(columnId)
  }

  setFolder(columnId: string, folder: WrittenFolder): void {
    this.folders.set(columnId, folder)
  }

  /** Every column's folder, as the vault last left it. */
  columnFolders(): IterableIterator<[string, WrittenFolder]> {
    return this.folders.entries()
  }

  /** Forgets the folders of columns that are gone from the board. */
  keepFolders(columnIds: Set<string>): void {
    for (const id of [...this.folders.keys()]) {
      if (!columnIds.has(id)) this.folders.delete(id)
    }
  }

  /** Follows a folder that moved: every file recorded under it moves with it. */
  reroot(from: string, to: string): void {
    for (const [id, entry] of this.entries) {
      if (dirOf(entry.path) !== from) continue
      const name = entry.path.slice(from.length)
      this.entries.set(id, { path: `${to}${name}`, hash: entry.hash })
    }
  }

  async load(): Promise<void> {
    if (this.loaded) return
    this.loaded = true

    const meta = await this.read()
    if (meta === null) return
    this.held = typeof meta.board === "string" ? meta.board : this.boardId

    for (const [id, entry] of section(meta.cards)) {
      if (typeof entry.path !== "string") continue
      // Vaults from before hashing kept the full text
      if (typeof entry.text === "string") {
        await this.set(id, { path: entry.path, text: entry.text })
      } else if (typeof entry.hash === "string") {
        this.entries.set(id, { path: entry.path, hash: entry.hash })
      }
    }

    for (const [id, entry] of section(meta.columns)) {
      if (typeof entry.name !== "string" || typeof entry.title !== "string") {
        continue
      }
      this.folders.set(id, { name: entry.name, title: entry.title })
    }
    this.saved = this.serialize()
  }

  async save(): Promise<void> {
    const text = this.serialize()
    if (text === this.saved) return
    this.saved = text
    await this.fs.write(this.path, text)
  }

  private async read(): Promise<Meta | null> {
    const text = await this.fs.read(this.path)
    if (text === null) return null

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return null
    }
    if (typeof parsed !== "object" || parsed === null) return null
    return parsed as Meta
  }

  private serialize(): string {
    return JSON.stringify(
      {
        board: this.held ?? this.boardId,
        cards: sorted(this.entries),
        columns: sorted(this.folders),
      },
      null,
      2
    )
  }
}
