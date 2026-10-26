import type { Card } from "@doska/contract"
import { CardFile } from "./card-file"
import { cardFiles, claim, type VaultFs } from "./column-folder"
import { dirOf, stemOf } from "./utils"
import type { Written } from "./written"

const TRASH = "_trash"

/** Deleted cards, kept as files so they can be dragged back out. */
export class Trash {
  readonly path: string

  private readonly fs: VaultFs
  private readonly written: Written
  private readonly deleteCard: (id: string) => Promise<void>

  constructor(
    fs: VaultFs,
    root: string,
    written: Written,
    deleteCard: (id: string) => Promise<void>
  ) {
    this.fs = fs
    this.path = `${root}/${TRASH}`
    this.written = written
    this.deleteCard = deleteCard
  }

  /** Whether the vault is the one that put this card's file in the trash. */
  holds(id: string): boolean {
    const path = this.written.get(id)?.path
    return path !== undefined && dirOf(path) === this.path
  }

  /** A free path in the trash for a file named `stem`. */
  pathFor(stem: string, taken: Set<string>): string {
    return `${this.path}/${claim(stem, taken)}.md`
  }

  /** Moves a card's file in, keeping its own name: its id is in the
   * frontmatter, so nothing needs it in the name. */
  async take(
    id: string,
    file: { path: string; text: string },
    taken: Set<string>
  ): Promise<void> {
    const path = this.pathFor(stemOf(file.path), taken)
    await this.fs.rename(file.path, path)
    await this.written.set(id, { path, text: file.text })
  }

  /** Writes a card whose file is already gone from its column. */
  async copy(card: Card, gonePath: string, taken: Set<string>): Promise<void> {
    const path = this.pathFor(stemOf(gonePath), taken)
    const text = CardFile.fromCard(card).text
    await this.fs.write(path, text)
    await this.written.set(card.id, { path, text })
  }

  /**
   * Files under `_trash` whose card is still live: someone dragged them there.
   * Fills `taken` with the names already in use. Returns whether the board
   * changed.
   */
  async sweep(cards: Map<string, Card>, taken: Set<string>): Promise<boolean> {
    const files = await cardFiles(this.fs, this.path)
    if (files === null) return false

    let changed = false
    const present = new Set<string>()
    for (const { path, text, card } of files) {
      taken.add(stemOf(path).toLowerCase())
      present.add(path)
      if (!card.id || !cards.has(card.id)) continue

      // The card is live and the vault is what trashed its file
      if (this.written.get(card.id)?.path === path) {
        await this.fs.remove(path)
        present.delete(path)
        this.written.delete(card.id)
        continue
      }

      await this.deleteCard(card.id)
      cards.delete(card.id)
      await this.written.set(card.id, { path, text })
      changed = true
    }

    this.forget(present)
    return changed
  }

  /** Records for copies someone emptied out of `_trash` by hand. Left behind,
   * they would keep growing `_meta.json` for cards that are long gone. */
  private forget(present: Set<string>): void {
    const stale = [...this.written]
      .filter(([id, entry]) => this.holds(id) && !present.has(entry.path))
      .map(([id]) => id)
    for (const id of stale) this.written.delete(id)
  }
}
