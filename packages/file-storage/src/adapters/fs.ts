import { extname, type FileInput, type FileStorage, type StoredFile } from "../file-storage"

/** Binary filesystem primitives (a subset of the app's Tauri `fs-adapter`). */
export interface FsPort {
  join(...parts: string[]): Promise<string>
  mkdir(path: string): Promise<void>
  writeFile(path: string, bytes: Uint8Array): Promise<void>
  readFile(path: string): Promise<Uint8Array>
  remove(path: string): Promise<void>
}

export interface FsDeps {
  fs: FsPort
  /**
   * Absolute path of the per-scope sidecar folder (e.g. `<Card>.assets`), or
   * null when the scope has no location yet. Backed by the fs path-index.
   */
  resolveAssetsDir: (scope: string) => Promise<string | null>
  /** Wraps an absolute path in an asset URL the webview can load (Tauri's `convertFileSrc`). */
  toAssetUrl: (path: string) => string | Promise<string>
  /** Mints a stable, collision-free stored filename. */
  newKey: () => string
}

/**
 * Filesystem-backed storage for folder-sync mode. Files live in a per-card
 * sidecar folder beside the card's `.md`, named by a stable id (not the display
 * label), so renaming a label never touches disk. Desktop-only.
 */
export class FsFileStorage implements FileStorage {
  private readonly deps: FsDeps

  constructor(deps: FsDeps) {
    this.deps = deps
  }

  private async pathFor(scope: string, key: string): Promise<string> {
    const dir = await this.deps.resolveAssetsDir(scope)
    if (!dir) throw new Error(`[file-storage] no location for scope ${scope}`)
    return this.deps.fs.join(dir, key)
  }

  async put(scope: string, input: FileInput): Promise<StoredFile> {
    const dir = await this.deps.resolveAssetsDir(scope)
    if (!dir) throw new Error(`[file-storage] no location for scope ${scope}`)
    const key = `${this.deps.newKey()}${extname(input.name)}`
    const path = await this.deps.fs.join(dir, key)
    await this.deps.fs.mkdir(dir)
    await this.deps.fs.writeFile(
      path,
      new Uint8Array(await input.bytes.arrayBuffer())
    )
    return { key, mime: input.mime, size: input.bytes.size }
  }

  async get(scope: string, key: string): Promise<Blob> {
    const bytes = await this.deps.fs.readFile(await this.pathFor(scope, key))
    return new Blob([bytes as BlobPart])
  }

  async url(scope: string, key: string): Promise<string> {
    return this.deps.toAssetUrl(await this.pathFor(scope, key))
  }

  async remove(scope: string, key: string): Promise<void> {
    await this.deps.fs.remove(await this.pathFor(scope, key))
  }
}
