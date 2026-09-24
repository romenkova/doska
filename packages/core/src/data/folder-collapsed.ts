import { useSyncExternalStore } from "react"
import { runtime } from "../runtime"

const COLLAPSED_FOLDERS_KEY = "doska:collapsed-folders"

const NONE: string[] = []

let collapsed: string[] | null = null

const listeners = new Set<() => void>()

function load(): string[] {
  if (collapsed) return collapsed
  const stored = runtime().kv.get(COLLAPSED_FOLDERS_KEY)
  try {
    collapsed = stored ? (JSON.parse(stored) as string[]) : []
  } catch {
    collapsed = []
  }
  return collapsed
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setFolderCollapsed(id: string, isCollapsed: boolean): void {
  const current = load()
  if (current.includes(id) === isCollapsed) return
  collapsed = isCollapsed
    ? [...current, id]
    : current.filter((folderId) => folderId !== id)
  runtime().kv.set(COLLAPSED_FOLDERS_KEY, JSON.stringify(collapsed))
  for (const listener of [...listeners]) listener()
}

/** Ids of the sidebar folders this device has collapsed. */
export function useCollapsedFolders(): string[] {
  return useSyncExternalStore(subscribe, load, () => NONE)
}
