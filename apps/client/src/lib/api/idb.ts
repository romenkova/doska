/**
 * A tiny promise-based wrapper over IndexedDB — enough for a local store without
 * pulling in a dependency. One object store per entity type, string keys,
 * structured-cloneable values. This is the app's durable, instant local cache;
 * `./sync` reconciles it with the backend in the background.
 */

const DB_NAME = "deck"
const VERSION = 4
const STORES = ["cards", "columns", "dashboards"] as const
export type StoreName = (typeof STORES)[number]

/** Stores from prior schema versions that are no longer used. */
const LEGACY_STORES = ["kv", "boards"]

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        for (const store of LEGACY_STORES) {
          if (db.objectStoreNames.contains(store)) db.deleteObjectStore(store)
        }
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

async function run<T>(
  store: StoreName,
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

export function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  return run<T | undefined>(store, "readonly", (s) => s.get(key))
}

export function idbGetAll<T>(store: StoreName): Promise<T[]> {
  return run<T[]>(store, "readonly", (s) => s.getAll())
}

export function idbSet(store: StoreName, key: string, value: unknown): Promise<void> {
  return run<void>(store, "readwrite", (s) => s.put(value, key))
}

export function idbDelete(store: StoreName, key: string): Promise<void> {
  return run<void>(store, "readwrite", (s) => s.delete(key))
}

export function idbCount(store: StoreName): Promise<number> {
  return run<number>(store, "readonly", (s) => s.count())
}
