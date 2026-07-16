import { HybridClock } from "@doska/sync"
import { idb, META_STORE } from "../db/idb"

const LAST_KEY = "hlc:last"

export const clock = new HybridClock()

/** Folds in the persisted high-water mark so the clock stays monotonic across reloads. */
export async function seedClock(): Promise<void> {
  const raw = await idb.get<number>(META_STORE, LAST_KEY)
  if (typeof raw === "number" && Number.isFinite(raw)) clock.receive(raw)
}

export async function persistClock(): Promise<void> {
  try {
    await idb.set(META_STORE, LAST_KEY, clock.last)
  } catch {
    // Storage unavailable; the next seed re-derives from remote timestamps.
  }
}

/** Timestamp for a local mutation; persists the new high-water mark in the background. */
export function stamp(): number {
  const ts = clock.now()
  void persistClock()
  return ts
}
