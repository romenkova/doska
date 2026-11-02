import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { IDB } from "../src/adapters/idb"
import type { ClientDB } from "../src/client-db"

type Schema = Record<string, readonly string[]>

const CARDS = "cards"
const META = "meta"
const schema: Schema = {
  [CARDS]: ["columnId", "deadline", "number"],
  [META]: [],
}

class TestIDB extends IDB {
  constructor(
    name: string,
    private testSchema: Schema
  ) {
    super(name, 1)
  }

  upgrade(db: IDBDatabase, tx: IDBTransaction) {
    for (const [store, indexes] of Object.entries(this.testSchema)) {
      const objectStore = db.objectStoreNames.contains(store)
        ? tx.objectStore(store)
        : db.createObjectStore(store)
      for (const index of indexes) {
        if (!objectStore.indexNames.contains(index))
          objectStore.createIndex(index, index)
      }
    }
  }
}

interface Card {
  id: string
  columnId: string
  number?: number
  deadline?: string | null
}

const cards: Card[] = [
  { id: "a", columnId: "c1", number: 1, deadline: "2026-01-02" },
  { id: "b", columnId: "c1", number: 2, deadline: "2026-01-01" },
  { id: "c", columnId: "c2", number: 3, deadline: null },
  { id: "d", columnId: "c2", number: 4 },
]

let sequence = 0

const adapters: [string, () => ClientDB][] = [
  ["IDB", () => new TestIDB(`conformance-${++sequence}`, schema)],]

describe.each(adapters)("%s", (_name, create) => {
  let db: ClientDB

  beforeEach(async () => {
    db = create()
    for (const card of cards) await db.set(CARDS, card.id, card)
  })

  it("gets what it set, and undefined for a missing key", async () => {
    expect(await db.get(CARDS, "a")).toEqual(cards[0])
    expect(await db.get(CARDS, "nope")).toBeUndefined()
  })

  it("overwrites on a repeated set", async () => {
    await db.set(CARDS, "a", { ...cards[0], columnId: "c9" })
    expect(await db.get<Card>(CARDS, "a")).toMatchObject({ columnId: "c9" })
    expect(await db.count(CARDS)).toBe(cards.length)
  })

  it("deletes, and tolerates deleting a missing key", async () => {
    await db.delete(CARDS, "a")
    await db.delete(CARDS, "nope")
    expect(await db.get(CARDS, "a")).toBeUndefined()
    expect(await db.count(CARDS)).toBe(cards.length - 1)
  })

  it("clears one store without touching another", async () => {
    await db.set(META, "cursor", { at: 1 })
    await db.clear(CARDS)
    expect(await db.count(CARDS)).toBe(0)
    expect(await db.get(META, "cursor")).toEqual({ at: 1 })
  })

  it("reads every record in primary key order", async () => {
    const all = await db.getAll<Card>(CARDS)
    expect(all.map((card) => card.id)).toEqual(["a", "b", "c", "d"])
  })

  it("seeks a primary key range", async () => {
    const range = await db.getAll<Card>(CARDS, {
      range: { lower: "b", upper: "c" },
    })
    expect(range.map((card) => card.id)).toEqual(["b", "c"])
  })

  it("honours exclusive bounds", async () => {
    expect(
      await db.keys(CARDS, {
        lower: "a",
        upper: "d",
        exclusive: { lower: true, upper: true },
      })
    ).toEqual(["b", "c"])
    expect(await db.keys(CARDS, { lower: "c" })).toEqual(["c", "d"])
    expect(await db.keys(CARDS, { upper: "b" })).toEqual(["a", "b"])
    expect(await db.keys(CARDS)).toEqual(["a", "b", "c", "d"])
  })

  it("caps a read at count", async () => {
    const two = await db.getAll<Card>(CARDS, { count: 2 })
    expect(two.map((card) => card.id)).toEqual(["a", "b"])
  })

  it("seeks an index range, ordered by index key then primary key", async () => {
    const column = await db.getAll<Card>(CARDS, {
      index: "columnId",
      range: { lower: "c1", upper: "c1" },
    })
    expect(column.map((card) => card.id)).toEqual(["a", "b"])

    const deadlines = await db.getAll<Card>(CARDS, {
      index: "deadline",
      range: { lower: "2026-01-01", upper: "2026-01-31" },
    })
    expect(deadlines.map((card) => card.id)).toEqual(["b", "a"])
  })

  it("seeks a numeric index numerically, not as text", async () => {
    const found = await db.getAll<Card>(CARDS, {
      index: "number",
      range: { lower: 3, upper: 3 },
    })
    expect(found.map((card) => card.id)).toEqual(["c"])

    await db.set(CARDS, "e", { id: "e", columnId: "c2", number: 12 })
    const range = await db.getAll<Card>(CARDS, {
      index: "number",
      range: { lower: 2, upper: 12 },
    })
    expect(range.map((card) => card.id)).toEqual(["b", "c", "d", "e"])
  })

  it("excludes records whose indexed property is null or absent", async () => {
    const scan = await db.getAll<Card>(CARDS, { index: "deadline" })
    expect(scan.map((card) => card.id)).toEqual(["b", "a"])
  })

  it("applies filter after the range, then count", async () => {
    const filtered = await db.getAll<Card>(CARDS, {
      index: "columnId",
      range: { lower: "c1", upper: "c2" },
      filter: (card) => card.deadline !== null && card.deadline !== undefined,
      count: 1,
    })
    expect(filtered.map((card) => card.id)).toEqual(["a"])
  })
})
