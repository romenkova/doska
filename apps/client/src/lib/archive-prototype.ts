import { useSyncExternalStore } from "react"

// PROTOTYPE: archived card ids, in memory only

let archived = new Set<string>()
const listeners = new Set<() => void>()

function set(next: Set<string>) {
  archived = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function archiveCards(ids: string[]) {
  set(new Set([...archived, ...ids]))
}

export function restoreCards(ids: string[]) {
  const next = new Set(archived)
  for (const id of ids) next.delete(id)
  set(next)
}

export function useArchivedIds(): Set<string> {
  return useSyncExternalStore(subscribe, () => archived)
}

export function useIsArchived(id: string | null): boolean {
  const ids = useArchivedIds()
  return id !== null && ids.has(id)
}
