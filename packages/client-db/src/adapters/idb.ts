import type { ClientDB, KeyRange, Query } from "../client-db"

function toIDBRange(range: KeyRange | undefined): IDBKeyRange | null {
  if (!range) return null
  const { lower, upper, exclusive } = range
  if (lower !== undefined && upper !== undefined) {
    return IDBKeyRange.bound(lower, upper, exclusive?.lower, exclusive?.upper)
  }
  if (lower !== undefined) return IDBKeyRange.lowerBound(lower, exclusive?.lower)
  if (upper !== undefined) return IDBKeyRange.upperBound(upper, exclusive?.upper)
  return null
}

/**
 * A blocked upgrade normally clears itself: the other tab's `onversionchange`
 * closes its connection.
 */
const BLOCKED_GRACE_MS = 3000

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
      const opening = this.connect(this.version)
      opening.catch(() => {
        if (this.connection === opening) this.connection = undefined
      })
      this.connection = opening
    }
    return this.connection
  }

  /** Opens the DB at `version`, or at whatever version already exists when
   * `version` is undefined. The undefined form is the downgrade fallback: an
   * older client whose `version` is below the stored one can't open with its
   * own number (IndexedDB rejects it as a downgrade), but the schema is only
   * ever added to, so attaching to the newer version is safe. */
  private connect(version?: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.name, version)
      let blockedTimer: ReturnType<typeof setTimeout> | undefined
      // `req.transaction` is the versionchange tx — the only handle to stores
      // that already exist, e.g. for adding an index on an upgrade.
      req.onupgradeneeded = () => this.upgrade(req.result, req.transaction!)
      req.onsuccess = () => {
        clearTimeout(blockedTimer)
        const db = req.result
        db.onversionchange = () => {
          db.close()
          this.connection = undefined
        }
        resolve(db)
      }
      req.onerror = () => {
        clearTimeout(blockedTimer)
        // The stored version is newer than ours — reopen without a version to
        // attach to it rather than fail the whole app with a blank page.
        if (req.error?.name === "VersionError" && version !== undefined) {
          this.connect(undefined).then(resolve, reject)
        } else {
          reject(req.error)
        }
      }
      req.onblocked = () => {
        console.warn(
          `IndexedDB "${this.name}" upgrade to v${this.version} is blocked by another open connection`
        )
        blockedTimer = setTimeout(
          () =>
            reject(
              new Error(
                "Another tab is still using an older version of this app. Close it and reload."
              )
            ),
          BLOCKED_GRACE_MS
        )
      }
    })
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
    const range = toIDBRange(query?.range)
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

  keys(store: string, range?: KeyRange): Promise<string[]> {
    return this.run<string[]>(store, "readonly", (s) =>
      s.getAllKeys(toIDBRange(range))
    )
  }

  clear(store: string): Promise<void> {
    return this.run<void>(store, "readwrite", (s) => s.clear())
  }
}
