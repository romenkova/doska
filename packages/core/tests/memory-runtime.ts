import type { KeyRange } from "@doska/ports"
import type { Runtime } from "../src/runtime"
import { installRuntime } from "../src/runtime"

/** An in-memory `ClientDB`, keyed `store/key`, honouring the cards-by-column index. */
export const rows = new Map<string, unknown>()

const inStore = (store: string) =>
  [...rows.entries()]
    .filter(([composite]) => composite.startsWith(`${store}/`))
    .map(([, value]) => value)

const db = {
  get: (store: string, key: string) =>
    Promise.resolve(rows.get(`${store}/${key}`)),
  getAll: (store: string, query?: { index: string; range: KeyRange }) =>
    Promise.resolve(
      inStore(store).filter(
        (row) =>
          !query ||
          (row as Record<string, unknown>)[query.index] === query.range.lower
      )
    ),
  set: (store: string, key: string, value: unknown) => {
    rows.set(`${store}/${key}`, value)
    return Promise.resolve()
  },
  delete: (store: string, key: string) => {
    rows.delete(`${store}/${key}`)
    return Promise.resolve()
  },
}

const kvStore = new Map<string, string>()
const kv = {
  get: (key: string) => kvStore.get(key) ?? null,
  set: (key: string, value: string) => void kvStore.set(key, value),
  remove: (key: string) => void kvStore.delete(key),
}

const net = { online: () => true, subscribe: () => () => {} }

// No server configured, so the engines stay paused and nothing reaches the wire.
const http = { isConfigured: () => false, subscribe: () => () => {} }

/** Wipes the stores and installs them as the runtime. Call in `beforeEach`. */
export function installMemoryRuntime() {
  rows.clear()
  kvStore.clear()
  installRuntime({ db, kv, net, http } as unknown as Runtime)
}
