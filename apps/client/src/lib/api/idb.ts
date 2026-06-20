/**
 * A tiny promise-based wrapper over IndexedDB
 */

const DB_NAME = "deck"
const VERSION = 8
const STORES = ["cards", "columns", "dashboards"] as const
export type StoreName = (typeof STORES)[number]

/** Sync bookkeeping (the pull cursor) — kept in the DB so it shares the data's
 * lifetime. Not dropped on upgrade, but gone if the whole DB is deleted. */
const META_STORE = "meta"

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store)
        }
        // The meta store persists across upgrades — only create it if missing.
        if (!db.objectStoreNames.contains(META_STORE))
          db.createObjectStore(META_STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

async function run<T>(
  store: StoreName | typeof META_STORE,
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = op(tx.objectStore(store))
    tx.oncomplete = () => resolve(req.result as T)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export function idbGet<T>(
  store: StoreName,
  key: string
): Promise<T | undefined> {
  return run<T | undefined>(store, "readonly", (s) => s.get(key))
}

export function idbGetAll<T>(store: StoreName): Promise<T[]> {
  return run<T[]>(store, "readonly", (s) => s.getAll())
}

export function idbSet(
  store: StoreName,
  key: string,
  value: unknown
): Promise<void> {
  return run<void>(store, "readwrite", (s) => s.put(value, key))
}

export function idbDelete(store: StoreName, key: string): Promise<void> {
  return run<void>(store, "readwrite", (s) => s.delete(key))
}

export function idbCount(store: StoreName): Promise<number> {
  return run<number>(store, "readonly", (s) => s.count())
}

/** Reads a value from the meta store (sync bookkeeping). */
export function metaGet<T>(key: string): Promise<T | undefined> {
  return run<T | undefined>(META_STORE, "readonly", (s) => s.get(key))
}

/** Writes a value to the meta store (sync bookkeeping). */
export function metaSet(key: string, value: unknown): Promise<void> {
  return run<void>(META_STORE, "readwrite", (s) => s.put(value, key))
}
