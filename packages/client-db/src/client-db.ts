/**
 * Narrows a `getAll` read. `index`, `range`, and `count` are handled by the
 * IndexedDB engine (fast path); `filter` runs in JS over the fetched range and
 * should be paired with a `range` to bound the scan.
 */
export interface Query<T> {
  /**
   * Reads from a secondary index instead of the primary key, so `range` applies
   * to the indexed property (e.g. an index on `columnId` with a `range` of
   * `IDBKeyRange.only(columnId)` returns just that column's records). The index
   * must have been declared in `upgrade`.
   */
  index?: string
  /** Restricts the scan to a key range over the index (or primary key). */
  range?: IDBKeyRange
  /** Caps the number of records returned. */
  count?: number
  /** Keeps records for which this returns true. */
  filter?: (value: T) => boolean
}

export interface ClientDB {
  name: string
  version: number
  get<T>(store: string, key: string): Promise<T | undefined>
  getAll<T>(store: string, query?: Query<T>): Promise<T[]>
  set(store: string, key: string, value: unknown): Promise<void>
  delete(store: string, key: string): Promise<void>
  count(store: string): Promise<number>
}
