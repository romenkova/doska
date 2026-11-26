import { CardFile } from "./card-file"
import { snakeName, baseNameOf } from "./utils"

/** The filesystem, as much of it as the vault needs. */
export interface VaultFs {
  read(path: string): Promise<string | null>
  write(path: string, content: string): Promise<void>
  /** Writes an attachment */
  writeBytes(path: string, bytes: Uint8Array): Promise<void>
  mkdir(path: string): Promise<void>
  rename(from: string, to: string): Promise<void>
  remove(path: string): Promise<void>
  readDir(path: string): Promise<string[] | null>
  readDirs(path: string): Promise<string[] | null>
  watch(path: string, listener: () => void): Promise<() => void>
}

/** A card file as found on disk. */
export interface VaultFile {
  path: string
  text: string
  card: CardFile
}

/**
 * The card files in a folder, parsed. `null` when the folder isn't there, the
 * way `readDir` reports it. Dotfiles and anything that isn't Markdown are not
 * the vault's to read.
 */
export async function cardFiles(
  fs: VaultFs,
  dir: string
): Promise<VaultFile[] | null> {
  const names = await fs.readDir(dir)
  if (names === null) return null

  const files: VaultFile[] = []
  for (const name of names) {
    if (!name.endsWith(".md") || name.startsWith(".")) continue
    const path = `${dir}/${name}`
    const text = await fs.read(path)
    if (text === null) continue
    files.push({ path, text, card: CardFile.parse(text) })
  }
  return files
}

/**
 * Takes `name`, or `name_2` when it's taken, and marks it used. Compared
 * case-insensitively: APFS would collide on "Inbox" and "inbox".
 */
export function claim(name: string, taken: Set<string>): string {
  let candidate = name
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    candidate = `${name}_${n}`
  }
  taken.add(candidate.toLowerCase())
  return candidate
}

/** A column as a folder of card files. */
export class ColumnFolder {
  readonly columnId: string
  readonly path: string

  private readonly fs: VaultFs
  /** Names handed out this pass, so two cards can't claim the same file. */
  private readonly used = new Set<string>()

  constructor(fs: VaultFs, columnId: string, path: string) {
    this.fs = fs
    this.columnId = columnId
    this.path = path
  }

  async list(): Promise<VaultFile[]> {
    const files = (await cardFiles(this.fs, this.path)) ?? []
    for (const file of files) this.used.add(baseNameOf(file.path).toLowerCase())
    return files
  }

  /** Writes `card` to `at`, or to a fresh name when it has no file yet. */
  async save(card: CardFile, at?: string): Promise<string> {
    const path = at ?? `${this.path}/${this.freeName(card)}`
    await this.fs.write(path, card.text)
    return path
  }

  /** Moves a file into this folder. */
  async take(from: string, card: CardFile): Promise<string> {
    const to = `${this.path}/${this.freeName(card)}`
    await this.fs.rename(from, to)
    return to
  }

  async retitle(path: string, card: CardFile): Promise<string> {
    const wanted = snakeName(card.title) || "card"
    const stem = baseNameOf(path)
    // `name_2` counts as `name`
    const suffix = stem.slice(wanted.length)
    if (stem.startsWith(wanted) && /^(_\d+)?$/.test(suffix)) return path

    const to = `${this.path}/${this.freeName(card)}`
    await this.fs.rename(path, to)
    return to
  }

  private freeName(card: CardFile): string {
    return `${claim(snakeName(card.title) || "card", this.used)}.md`
  }
}
