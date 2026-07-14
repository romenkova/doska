import type { ClientDB, Query } from "../client-db"

/**
 * A tiny promise-based wrapper over IndexedDB
 */
export class IDB implements ClientDB {
  name: string
  version: number
  connection?: Promise<IDBDatabase>

  constructor(name: string, version: number) {
    this.name = name
    this.version = version
  }

  upgrade(_db: IDBDatabase, _tx: IDBTransaction) {}

  open(): Promise<IDBDatabase> {
    if (!this.connection) {
      this.connection = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.name, this.version)
        // `req.transaction` is the versionchange tx — the only handle to stores
        // that already exist, e.g. for adding an index on an upgrade.
        req.onupgradeneeded = () => this.upgrade(req.result, req.transaction!)
        req.onsuccess = () => {
          const db = req.result
          db.onversionchange = () => {
            db.close()
            this.connection = undefined
          }
          resolve(db)
        }
        req.onerror = () => reject(req.error)
        req.onblocked = () =>
          console.warn(
            `IndexedDB "${this.name}" upgrade to v${this.version} is blocked by another open connection`
          )
      })
    }
    return this.connection
  }

  async run<T>(
    store: string,
    mode: IDBTransactionMode,
    op: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    const db = await this.open()
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode)
      const req = op(tx.objectStore(store))
      tx.oncomplete = () => resolve(req.result as T)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  get<T>(store: string, key: string): Promise<T | undefined> {
    return this.run<T | undefined>(store, "readonly", (s) => s.get(key))
  }

  async getAll<T>(store: string, query?: Query<T>): Promise<T[]> {
    const range = query?.range ?? null
    const rows = await this.run<T[]>(store, "readonly", (s) => {
      const source = query?.index ? s.index(query.index) : s
      return source.getAll(range, query?.filter ? undefined : query?.count)
    })
    if (!query?.filter) return rows
    const out = rows.filter(query.filter)
    return query.count === undefined ? out : out.slice(0, query.count)
  }

  set(store: string, key: string, value: unknown): Promise<void> {
    return this.run<void>(store, "readwrite", (s) => s.put(value, key))
  }

  delete(store: string, key: string): Promise<void> {
    return this.run<void>(store, "readwrite", (s) => s.delete(key))
  }

  count(store: string): Promise<number> {
    return this.run<number>(store, "readonly", (s) => s.count())
  }
}
