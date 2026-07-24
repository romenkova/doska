import { HybridClock } from "@doska/sync"
import { idb, META_STORE } from "../db/idb"

const LAST_KEY = "hlc:last"

export const clock = new HybridClock()

/**
 * The mark is mirrored in `localStorage` as well as IDB because IDB writes are
 * async: a mobile browser can evict the app before one lands, and a clock that
 * comes back regressed hands out timestamps below ones it already issued. Those
 * edits then lose LWW to older ones and vanish with no error anywhere. IDB stays
 * as the backstop for when `localStorage` is the one that gets cleared.
 */
function readLocal(): number {
  try {
    const raw = Number(localStorage.getItem(LAST_KEY))
    return Number.isFinite(raw) ? raw : 0
  } catch {
    return 0
  }
}

function writeLocal(ts: number): void {
  try {
    localStorage.setItem(LAST_KEY, String(ts))
  } catch {
    // Storage unavailable (private mode, quota); IDB still carries the mark.
  }
}

/** Folds in the persisted high-water mark so the clock stays monotonic across reloads. */
export async function seedClock(): Promise<void> {
  clock.receive(readLocal())
  const raw = await idb.get<number>(META_STORE, LAST_KEY)
  if (typeof raw === "number" && Number.isFinite(raw)) clock.receive(raw)
}

export async function persistClock(): Promise<void> {
  writeLocal(clock.last)
  try {
    await idb.set(META_STORE, LAST_KEY, clock.last)
  } catch {
    // Storage unavailable; the next seed re-derives from remote timestamps.
  }
}

/** Timestamp for a local mutation; the high-water mark is durable before it returns. */
export function stamp(): number {
  const ts = clock.now()
  writeLocal(ts)
  void persistClock()
  return ts
}
