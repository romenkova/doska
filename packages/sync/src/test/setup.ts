/**
 * `DirtyStore` persists to `localStorage`, which node doesn't have. Without a
 * stand-in its writes silently no-op and any test about surviving a reload
 * would pass vacuously.
 */
const store = new Map<string, string>()

globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
} as Storage
