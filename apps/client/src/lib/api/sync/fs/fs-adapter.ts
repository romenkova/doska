import { isDesktop } from "../../runtime"

/**
 * Desktop-only filesystem access for the folder sync backend. Every Tauri module
 * is loaded with a lazy `import(...)` behind an `isDesktop()` guard, so the web
 * bundle never evaluates them (same shape as `appFetch` in `runtime.ts`).
 *
 * Paths in the rest of the FS layer are POSIX-relative to the sync root; this
 * adapter is the one place that deals in absolute OS paths, built via Tauri's
 * platform-aware `join`.
 */

function assertDesktop(): void {
  if (!isDesktop())
    throw new Error("[fs-sync] filesystem backend is desktop-only")
}

export interface DirEntry {
  name: string
  isDirectory: boolean
  isFile: boolean
}

/** Opens the native folder picker; returns the chosen absolute path or null. */
export async function pickFolder(): Promise<string | null> {
  assertDesktop()
  const { open } = await import("@tauri-apps/plugin-dialog")
  const picked = await open({ directory: true, multiple: false })
  return typeof picked === "string" ? picked : null
}

export async function join(...parts: string[]): Promise<string> {
  assertDesktop()
  const { join: tauriJoin } = await import("@tauri-apps/api/path")
  return tauriJoin(...parts)
}

export async function readTextFile(path: string): Promise<string> {
  assertDesktop()
  const { readTextFile: read } = await import("@tauri-apps/plugin-fs")
  return read(path)
}

/** Creates parent directories as needed. */
export async function writeTextFile(
  path: string,
  contents: string
): Promise<void> {
  assertDesktop()
  const fs = await import("@tauri-apps/plugin-fs")
  const dir = path.replace(/[/\\][^/\\]*$/, "")
  if (dir && dir !== path) await fs.mkdir(dir, { recursive: true })
  await fs.writeTextFile(path, contents)
}

export async function mkdir(path: string): Promise<void> {
  assertDesktop()
  const { mkdir: make } = await import("@tauri-apps/plugin-fs")
  await make(path, { recursive: true })
}

export async function readDir(path: string): Promise<DirEntry[]> {
  assertDesktop()
  const { readDir: read } = await import("@tauri-apps/plugin-fs")
  const entries = await read(path)
  return entries.map((e) => ({
    name: e.name,
    isDirectory: e.isDirectory,
    isFile: e.isFile,
  }))
}

/** Missing paths are ignored. */
export async function remove(path: string): Promise<void> {
  assertDesktop()
  const { remove: rm, exists: has } = await import("@tauri-apps/plugin-fs")
  if (!(await has(path))) return
  await rm(path, { recursive: true })
}

export async function rename(from: string, to: string): Promise<void> {
  assertDesktop()
  const fs = await import("@tauri-apps/plugin-fs")
  const dir = to.replace(/[/\\][^/\\]*$/, "")
  if (dir && dir !== to) await fs.mkdir(dir, { recursive: true })
  await fs.rename(from, to)
}

export async function exists(path: string): Promise<boolean> {
  assertDesktop()
  const { exists: has } = await import("@tauri-apps/plugin-fs")
  return has(path)
}

/** A file's last-modified time in ms since the epoch, or 0 if unavailable. */
export async function mtimeMs(path: string): Promise<number> {
  assertDesktop()
  const { stat } = await import("@tauri-apps/plugin-fs")
  const info = await stat(path)
  return info.mtime ? info.mtime.getTime() : 0
}

/** Watches `root` recursively; returns an unwatch function. */
export async function watch(
  root: string,
  onChange: () => void
): Promise<() => void> {
  assertDesktop()
  const { watchImmediate } = await import("@tauri-apps/plugin-fs")
  const unwatch = await watchImmediate(root, () => onChange(), {
    recursive: true,
  })
  return unwatch
}
