import { CardSchema, ColumnSchema, DashboardSchema } from "@doska/contract"
import type { ClientDB, KeyRange, Query } from "@doska/ports"
import { CARDS, COLUMNS, DASHBOARDS } from "../constants"

const SCHEMAS: Record<
  string,
  typeof CardSchema | typeof ColumnSchema | typeof DashboardSchema | undefined
> = {
  [CARDS]: CardSchema,
  [COLUMNS]: ColumnSchema,
  [DASHBOARDS]: DashboardSchema,
}

/** Fills a record's missing fields from its schema; a record that doesn't fit is kept as is. */
export function withDefaults(store: string, value: unknown): unknown {
  const schema = SCHEMAS[store]
  if (!schema) return value
  const result = schema.safeParse(value)
  if (result.success) return result.data
  console.warn(`${store} record doesn't match its schema`, result.error)
  return value
}

export function validatedDb(db: ClientDB): ClientDB {
  return {
    get name() {
      return db.name
    },
    get version() {
      return db.version
    },
    get<T>(store: string, key: string) {
      return db.get<T>(store, key)
    },
    getAll<T>(store: string, query?: Query<T>) {
      return db.getAll<T>(store, query)
    },
    set(store: string, key: string, value: unknown) {
      return db.set(store, key, withDefaults(store, value))
    },
    delete(store: string, key: string) {
      return db.delete(store, key)
    },
    count(store: string) {
      return db.count(store)
    },
    keys(store: string, range?: KeyRange) {
      return db.keys(store, range)
    },
    clear(store: string) {
      return db.clear(store)
    },
  }
}
