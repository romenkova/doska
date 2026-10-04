import type { Card, Column } from "@doska/contract"
import { CardFile, type CardPatch } from "./card-file"
import { FILES, fileNameOf } from "./card-format"
import {
  cardFiles,
  type ColumnFolder,
  type VaultFile,
  type VaultFs,
} from "./column-folder"
import { Folders } from "./folders"
import { Trash } from "./trash"
import { dirOf, stemOf, titleOf } from "./utils"
import { Written } from "./written"

/** A card file on disk, with the folder it was found in. */
interface Found {
  file: VaultFile
  folder: ColumnFolder
}

/** The board, as much of it as the vault needs. The app wires this to its store. */
export interface VaultBoard {
  load(): Promise<{ columns: Column[]; cards: Card[] }>
  createCard(columnId: string): Promise<string>
  createColumn(title: string): Promise<string>
  updateCard(id: string, patch: CardPatch): Promise<void>
  moveCardToColumn(id: string, columnId: string): Promise<void>
  renameColumn(id: string, title: string): Promise<void>
  deleteCard(id: string): Promise<void>
  restoreCard(id: string): Promise<void>
  deleted(): Promise<{ columns: string[]; cards: string[] }>
}

/** The attachment bytes behind a card's keys. The vault only ever reads. */
export interface VaultFiles {
  get(cardId: string, key: string): Promise<Uint8Array>
}

export interface VaultOptions {
  fs: VaultFs
  board: VaultBoard
  /** Whose board this is. A folder is mirrored by one board at a time. */
  boardId: string
  /** Mirrors attachments into `_files` */
  files?: VaultFiles
  /** The folder the board lives in. */
  root: string
  /** Called after the vault changed the board, so the app can refetch. */
  onBoardChange?: () => void
  /** A sync that failed. Nothing above the watcher can catch these. */
  onError?: (error: unknown) => void
}

/**
 * A board mirrored to a folder: one folder per column, one Markdown file per
 * card, deleted cards under `_trash`.
 */
export class Vault {
  private readonly fs: VaultFs
  private readonly board: VaultBoard
  private readonly boardId: string
  private readonly files?: VaultFiles
  private readonly root: string
  private readonly onBoardChange?: () => void
  private readonly onError?: (error: unknown) => void

  private readonly written: Written
  private readonly folders: Folders
  private readonly trash: Trash

  private running = false
  private queued = false

  constructor({
    fs,
    board,
    boardId,
    files,
    root,
    onBoardChange,
    onError,
  }: VaultOptions) {
    this.fs = fs
    this.board = board
    this.boardId = boardId
    this.files = files
    this.root = root
    this.onBoardChange = onBoardChange
    this.onError = onError
    this.written = new Written(fs, root, boardId)
    this.folders = new Folders(fs, root, this.written, (title) =>
      board.createColumn(title)
    )
    this.trash = new Trash(fs, root, this.written, (id) => board.deleteCard(id))
  }

  /**
   * Takes the folder for this board, whoever mirrored it before. The board the
   * folder is taken from stops on its next pass.
   */
  async claim(): Promise<void> {
    await this.written.load()
    this.written.claim()
    await this.written.save()
  }

  async watch(): Promise<() => void> {
    await this.sync().catch((error: unknown) => this.onError?.(error))
    return this.fs.watch(this.root, () => {
      this.sync().catch((error: unknown) => this.onError?.(error))
    })
  }

  async sync(): Promise<void> {
    if (this.running) {
      this.queued = true
      return
    }
    this.running = true
    try {
      do {
        this.queued = false
        await this.pass()
      } while (this.queued)
    } finally {
      this.running = false
    }
  }

  private async pass(): Promise<void> {
    if ((await this.fs.readDir(this.root)) === null) return

    // Two boards mirroring one folder each adopt what the other wrote, and
    // every adoption gives the other something new to adopt.
    const owner = await this.written.owner()
    if (owner !== null && owner !== this.boardId) {
      throw new Error(`This folder is mirrored by another board (${owner}).`)
    }

    await this.written.load()

    const board = await this.board.load()
    const dropped = await this.board.deleted()
    const { folders, retitled, gone, created } = await this.folders.resolve(
      board.columns,
      board.cards,
      new Set(dropped.columns)
    )
    await this.fs.mkdir(this.trash.path)
    for (const folder of folders) await this.fs.mkdir(folder.path)

    for (const [id, title] of retitled) {
      await this.board.renameColumn(id, title)
    }
    let changed = retitled.size > 0 || created > 0

    const cards = new Map(board.cards.map((card) => [card.id, card]))
    await this.mirrorFiles(board.cards)

    const inTrash = new Set<string>()
    if (await this.trash.sweep(cards, inTrash)) changed = true
    await this.retire(gone, inTrash)

    const { files, empty, adopted } = await this.index(folders)
    if (adopted) changed = true

    const byColumn = new Map(folders.map((f) => [f.columnId, f]))
    const wiped = this.wiped(empty)
    if (await this.syncCards(cards, files, wiped, byColumn, inTrash)) {
      changed = true
    }
    const deleted = new Set(dropped.cards)
    if (await this.syncOrphans(cards, files, deleted, inTrash)) changed = true

    await this.written.save()
    if (changed) this.onBoardChange?.()
  }

  /**
   * The folders of columns the board dropped. Their cards went with the column,
   * so their files go to the trash and the folder goes with them. Anything the
   * vault didn't put there keeps the folder alive.
   */
  private async retire(gone: Set<string>, inTrash: Set<string>): Promise<void> {
    for (const name of gone) {
      const path = `${this.root}/${name}`
      for (const file of (await cardFiles(this.fs, path)) ?? []) {
        if (!file.card.id) continue
        await this.trash.take(file.card.id, file, inTrash)
      }
      if (await this.isEmpty(path)) await this.fs.remove(path)
    }
  }

  private async isEmpty(path: string): Promise<boolean> {
    const files = (await this.fs.readDir(path)) ?? []
    const dirs = (await this.fs.readDirs(path)) ?? []
    return files.length === 0 && dirs.length === 0
  }

  /** Every card file on disk, by id. Whatever isn't a card yet becomes one. */
  private async index(folders: ColumnFolder[]): Promise<{
    files: Map<string, Found>
    empty: Set<string>
    adopted: boolean
  }> {
    const files = new Map<string, Found>()
    const empty = new Set<string>()
    let adopted = false

    for (const folder of folders) {
      const listed = await folder.list()
      if (listed.length === 0) empty.add(folder.path)
      for (const file of listed) {
        const id = file.card.id
        // A file with no id is a note someone dropped in, and a copy of a card
        // is a new card too: both become one.
        if (!id || files.has(id)) {
          await this.adopt(file, folder)
          adopted = true
          continue
        }
        files.set(id, { file, folder })
      }
    }

    return { files, empty, adopted }
  }

  /**
   * Folders that lost every one of their files at once. That is a folder event,
   * not one delete per card: a cloud client resyncing, or the folder itself
   * dropped. Their cards keep their files, which get written back this pass.
   */
  private wiped(empty: Set<string>): Set<string> {
    const counts = new Map<string, number>()
    for (const { path } of this.written.values()) {
      const dir = dirOf(path)
      if (empty.has(dir)) counts.set(dir, (counts.get(dir) ?? 0) + 1)
    }

    const wiped = new Set<string>()
    for (const [dir, count] of counts) {
      if (count > 1) wiped.add(dir)
    }
    return wiped
  }

  /** Every live card against its file. Returns whether the board changed. */
  private async syncCards(
    cards: Map<string, Card>,
    files: Map<string, Found>,
    wiped: Set<string>,
    byColumn: Map<string, ColumnFolder>,
    inTrash: Set<string>
  ): Promise<boolean> {
    let changed = false
    for (const card of cards.values()) {
      const found = files.get(card.id)
      const last = this.written.get(card.id)
      // The vault wrote this file and can't find it any more, so it was
      // deleted. A copy goes to the trash.
      if (!found && last && !wiped.has(dirOf(last.path))) {
        await this.trash.copy(card.id, last, inTrash)
        await this.board.deleteCard(card.id)
        changed = true
        continue
      }
      if (await this.reconcile(card, found, byColumn)) changed = true
    }
    return changed
  }

  /** Files with no live card behind them any more. */
  private async syncOrphans(
    cards: Map<string, Card>,
    files: Map<string, Found>,
    deleted: Set<string>,
    inTrash: Set<string>
  ): Promise<boolean> {
    let changed = false
    for (const [id, { file, folder }] of files) {
      if (cards.has(id)) continue

      // A card this board never had
      if (!deleted.has(id)) {
        await this.adopt(file, folder)
        changed = true
        continue
      }

      // The vault didn't put this file here, so the user did: it came back out
      // of the trash. The card comes back with it, into the folder it landed in.
      if (!this.written.has(id) || this.trash.holds(id)) {
        await this.board.restoreCard(id)
        await this.board.moveCardToColumn(id, folder.columnId)
        changed = true
        continue
      }

      await this.trash.take(id, file, inTrash)
    }
    return changed
  }

  /**
   * Copies each card's attachments into `_files`.
   */
  private async mirrorFiles(cards: Card[]): Promise<void> {
    if (!this.files) return

    const dir = `${this.root}/${FILES}`
    await this.fs.mkdir(dir)
    const have = new Set((await this.fs.readDir(dir)) ?? [])

    for (const card of cards) {
      for (const attachment of card.attachments ?? []) {
        const name = fileNameOf(attachment.key)
        if (have.has(name)) continue
        try {
          const bytes = await this.files.get(card.id, attachment.key)
          await this.fs.writeBytes(`${dir}/${name}`, bytes)
          have.add(name)
        } catch {
          // Signed out or offline is expected to error
        }
      }
    }
  }

  /** Turns a file that isn't a card yet into one, then stamps it with its id. */
  private async adopt(file: VaultFile, folder: ColumnFolder): Promise<void> {
    const id = await this.board.createCard(folder.columnId)
    const card = new CardFile({
      id,
      title: file.card.title || titleOf(stemOf(file.path)),
      body: file.card.body,
      deadline: file.card.deadline,
      priority: file.card.priority,
      tags: file.card.tags,
      users: file.card.users,
      extra: file.card.extra,
    })

    await this.board.updateCard(id, {
      title: card.title,
      body: card.body,
      deadline: card.deadline || null,
      priority: card.priority,
      tags: card.tags,
      users: card.users,
    })
    await folder.save(card, file.path)
    this.written.set(id, { path: file.path, text: card.text })
  }

  /** One card against its file. Returns whether the board changed. */
  private async reconcile(
    card: Card,
    found: Found | undefined,
    byColumn: Map<string, ColumnFolder>
  ): Promise<boolean> {
    if (!found) {
      const folder = byColumn.get(card.columnId)
      if (!folder) return false
      const file = CardFile.fromCard(card)
      this.written.set(card.id, {
        path: await folder.save(file),
        text: file.text,
      })
      return false
    }

    const { file, folder } = found
    const last = this.written.get(card.id)
    let changed = false

    if (!last || last.text !== file.text) {
      const patch = file.card.patchFor(card)
      if (patch) {
        await this.board.updateCard(card.id, patch)
        changed = true
      }
      this.written.set(card.id, { path: file.path, text: file.text })
    }

    if (folder.columnId !== card.columnId) {
      if (last && last.path === file.path) {
        // The file didn't move, so the card did: follow it.
        const target = byColumn.get(card.columnId)
        if (target) {
          const path = await target.take(file.path, file.card)
          this.written.set(card.id, { path, text: file.text })
        }
      } else {
        await this.board.moveCardToColumn(card.id, folder.columnId)
        this.written.set(card.id, { path: file.path, text: file.text })
        changed = true
      }
      return changed
    }

    // The card is ahead of the file only when the file wasn't the one to move.
    const wanted = CardFile.fromCard(card, file.card.extra)
    if (!changed && wanted.text !== file.text) {
      const path = await folder.retitle(file.path, wanted)
      await folder.save(wanted, path)
      this.written.set(card.id, { path, text: wanted.text })
    }
    return changed
  }
}
