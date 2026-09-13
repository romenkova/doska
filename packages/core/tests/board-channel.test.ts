import { beforeEach, describe, expect, it } from "vitest"
import type { Change } from "@doska/contract"
import { DirtyStore } from "@doska/sync"
import type { KeyRange } from "@doska/ports"
import type { Card, Column, Dashboard } from "../src/types"
import type { Runtime } from "../src/runtime"
import { installRuntime } from "../src/runtime"
import { CARDS, COLUMNS, DASHBOARDS, META_STORE } from "../src/api/constants"
import { db } from "../src/api/db/db"
import {
  applyBoardRemote,
  collectBoardChanges,
} from "../src/api/sync/drivers/board-channel"
import { compact } from "../src/api/sync/drivers/channel-shared"
import { purgeBoard } from "../src/api/sync/drivers/dashboard-channel"

/** An in-memory `ClientDB`, keyed `store/key`, honouring the cards-by-column index. */
const rows = new Map<string, unknown>()

const inStore = (store: string) =>
  [...rows.entries()]
    .filter(([composite]) => composite.startsWith(`${store}/`))
    .map(([, value]) => value)

const fakeDb = {
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

const board: Dashboard = {
  id: "board",
  title: "Board",
  position: "a0",
  sort: [],
  updatedAt: 1,
  deletedAt: null,
}

const column: Column = {
  id: "col",
  title: "Col",
  position: "a0",
  dashboardId: "board",
  collapsed: false,
  color: "",
  done: false,
  updatedAt: 1,
  deletedAt: null,
  stamps: {},
}

/** Every group stamped at `at`, the shape a synced record has. */
const cardAt = (at: number, fields: Partial<Card> = {}): Card => ({
  id: "card",
  title: "Title",
  body: "one\ntwo\nthree\n",
  position: "a0",
  columnId: "col",
  number: 7,
  deadline: null,
  priority: "",
  attachments: [],
  updatedAt: at,
  deletedAt: null,
  stamps: {
    title: at,
    body: at,
    place: at,
    deadline: at,
    priority: at,
    attachments: at,
    deleted: at,
    conflict: at,
  },
  bodyConflict: null,
  ...fields,
})

const syncedBody = () => rows.get(`${META_STORE}/synced-body:card`)

/** The card as it stands after one clean pull at stamp 10. */
async function seedSynced() {
  rows.set(`${DASHBOARDS}/board`, board)
  rows.set(`${COLUMNS}/col`, column)
  await applyBoardRemote("board", [{ store: CARDS, record: cardAt(10) }])
}

async function pushed(dirty: DirtyStore) {
  const { changes } = await collectBoardChanges("board", dirty)
  return changes.find((c) => c.store === CARDS) as Extract<
    Change,
    { store: "cards" }
  >
}

beforeEach(() => {
  rows.clear()
  kvStore.clear()
  installRuntime({ db: fakeDb, kv } as unknown as Runtime)
})

describe("applyBoardRemote", () => {
  it("takes a card it has never seen and records its body as synced", async () => {
    await seedSynced()

    expect(await db.getCard("card")).toEqual(cardAt(10))
    expect(syncedBody()).toBe("one\ntwo\nthree\n")
  })

  it("applies a newer deadline over an unpushed body edit and keeps the edit", async () => {
    await seedSynced()
    const local = await db.getCard("card")
    await db.setCard({
      ...local!,
      body: "one edited\ntwo\nthree\n",
      updatedAt: 12,
      stamps: { ...local!.stamps, body: 12 },
    })

    const remote = cardAt(10, {
      deadline: "2026-10-01",
      updatedAt: 15,
      stamps: { ...cardAt(10).stamps, deadline: 15 },
    })
    await applyBoardRemote("board", [{ store: CARDS, record: remote }])

    const card = await db.getCard("card")
    expect(card!.deadline).toBe("2026-10-01")
    expect(card!.body).toBe("one edited\ntwo\nthree\n")
    expect(card!.stamps.body).toBe(12)
    expect(card!.updatedAt).toBe(15)
    expect(syncedBody()).toBe("one\ntwo\nthree\n")
  })

  it("replaces the body when nothing local is unpushed", async () => {
    await seedSynced()

    const remote = cardAt(10, {
      body: "one\ntwo\nthree edited\n",
      updatedAt: 15,
      stamps: { ...cardAt(10).stamps, body: 15 },
    })
    await applyBoardRemote("board", [{ store: CARDS, record: remote }])

    const card = await db.getCard("card")
    expect(card!.body).toBe("one\ntwo\nthree edited\n")
    expect(card!.stamps.body).toBe(15)
    expect(syncedBody()).toBe("one\ntwo\nthree edited\n")
  })

  it("keeps an unpushed body edit over a newer remote body, then pushes it with the base", async () => {
    await seedSynced()
    const local = await db.getCard("card")
    await db.setCard({
      ...local!,
      body: "one edited\ntwo\nthree\n",
      updatedAt: 12,
      stamps: { ...local!.stamps, body: 12 },
    })
    const dirty = new DirtyStore(kv, "test")
    dirty.mark("cards/card")

    const remote = cardAt(10, {
      body: "one\ntwo\nthree edited\n",
      updatedAt: 15,
      stamps: { ...cardAt(10).stamps, body: 15 },
    })
    await applyBoardRemote("board", [{ store: CARDS, record: remote }])

    const card = await db.getCard("card")
    expect(card!.body).toBe("one edited\ntwo\nthree\n")
    expect(card!.stamps.body).toBe(12)
    expect(syncedBody()).toBe("one\ntwo\nthree\n")
    expect(dirty.has("cards/card")).toBe(true)

    const change = await pushed(dirty)
    expect(change.record.body).toBe("one edited\ntwo\nthree\n")
    expect(change.baseBody).toBe("one\ntwo\nthree\n")
  })

  it("lands the server's number when every stamp ties", async () => {
    await seedSynced()
    const local = await db.getCard("card")
    await db.setCard({ ...local!, number: null })

    await applyBoardRemote("board", [{ store: CARDS, record: cardAt(10) }])

    expect((await db.getCard("card"))!.number).toBe(7)
  })

  it("does not rewrite a card the pull left unchanged", async () => {
    await seedSynced()
    const before = await db.getCard("card")
    rows.set(`${CARDS}/card`, { ...before, marker: "untouched" })

    await applyBoardRemote("board", [{ store: CARDS, record: cardAt(10) }])

    expect(rows.get(`${CARDS}/card`)).toHaveProperty("marker", "untouched")
  })

  it("merges a column group by group", async () => {
    rows.set(`${DASHBOARDS}/board`, board)
    await db.setColumn({
      ...column,
      title: "Renamed",
      updatedAt: 12,
      stamps: { title: 12 },
    })

    const remote: Column = {
      ...column,
      color: "red",
      updatedAt: 15,
      stamps: {
        title: 1,
        position: 1,
        collapsed: 1,
        color: 15,
        done: 1,
        deleted: 1,
      },
    }
    await applyBoardRemote("board", [{ store: COLUMNS, record: remote }])

    const stored = await db.getColumn("col")
    expect(stored!.title).toBe("Renamed")
    expect(stored!.color).toBe("red")
    expect(stored!.updatedAt).toBe(15)
  })
})

describe("push", () => {
  it("sends no base for a card that never synced", async () => {
    rows.set(`${DASHBOARDS}/board`, board)
    rows.set(`${COLUMNS}/col`, column)
    await db.setCard(cardAt(5, { number: null }))
    const dirty = new DirtyStore(kv, "test")
    dirty.mark("cards/card")

    const change = await pushed(dirty)
    expect(change.baseBody).toBeUndefined()
  })

  it("sends no base when the body is what the server has", async () => {
    await seedSynced()
    const dirty = new DirtyStore(kv, "test")
    dirty.mark("cards/card")

    const change = await pushed(dirty)
    expect(change.baseBody).toBeUndefined()
  })

  it("moves the synced body on to what was pushed, even if typing went on", async () => {
    await seedSynced()
    const local = (await db.getCard("card"))!
    await db.setCard({
      ...local,
      body: "one edited\ntwo\nthree\n",
      updatedAt: 12,
      stamps: { ...local.stamps, body: 12 },
    })
    const dirty = new DirtyStore(kv, "test")
    dirty.mark("cards/card")
    const change = await pushed(dirty)
    expect(change.baseBody).toBe("one\ntwo\nthree\n")

    // Typed while the push was out.
    await db.setCard({
      ...local,
      body: "one edited more\ntwo\nthree\n",
      updatedAt: 13,
      stamps: { ...local.stamps, body: 13 },
    })

    // The ack echoes the pushed body as the server stored it.
    await applyBoardRemote("board", [{ store: CARDS, record: change.record }])

    const card = await db.getCard("card")
    expect(card!.body).toBe("one edited more\ntwo\nthree\n")
    expect(syncedBody()).toBe("one edited\ntwo\nthree\n")

    const next = await pushed(dirty)
    expect(next.baseBody).toBe("one edited\ntwo\nthree\n")
  })

  it("takes the server's merge of the pushed body", async () => {
    await seedSynced()
    const local = (await db.getCard("card"))!
    await db.setCard({
      ...local,
      body: "one edited\ntwo\nthree\n",
      updatedAt: 12,
      stamps: { ...local.stamps, body: 12 },
    })
    const dirty = new DirtyStore(kv, "test")
    dirty.mark("cards/card")
    await pushed(dirty)

    const merged = cardAt(10, {
      body: "one edited\ntwo\nthree edited\n",
      updatedAt: 16,
      stamps: { ...cardAt(10).stamps, body: 16 },
    })
    await applyBoardRemote("board", [{ store: CARDS, record: merged }])

    expect((await db.getCard("card"))!.body).toBe(
      "one edited\ntwo\nthree edited\n"
    )
    expect(syncedBody()).toBe("one edited\ntwo\nthree edited\n")
  })
})

describe("synced body lifetime", () => {
  it("goes with the card on a hard delete", async () => {
    await seedSynced()

    await db.hardDelete(CARDS, "card")

    expect(syncedBody()).toBeUndefined()
  })

  it("goes with the card when compaction sweeps its tombstone", async () => {
    await seedSynced()
    const local = (await db.getCard("card"))!
    await db.setCard({ ...local, deletedAt: 1 })

    await compact(new DirtyStore(kv, "test"), ["cards/card"])

    expect(rows.has(`${CARDS}/card`)).toBe(false)
    expect(syncedBody()).toBeUndefined()
  })

  it("goes with every card when a board is purged", async () => {
    await seedSynced()

    await purgeBoard("board")

    expect(rows.has(`${CARDS}/card`)).toBe(false)
    expect(syncedBody()).toBeUndefined()
  })
})
