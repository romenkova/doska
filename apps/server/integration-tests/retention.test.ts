import { RETENTION_MS } from "@doska/contract"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { getDB } from "../src/db/get-db"
import { cards, columns, dashboards, history } from "../src/db/schema"
import { purgeExpired } from "../src/db/sync/purge"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const now = 1_000_000_000_000

function card(id: string) {
  return {
    id,
    title: id,
    body: "",
    position: "a",
    columnId: "c1",
    number: null,
    deadline: null,
    attachments: [],
    updatedAt: now,
    deletedAt: null,
  }
}

function dashboard(id: string, deletedAt: number | null) {
  return {
    id,
    title: id,
    position: "a",
    updatedAt: now,
    deletedAt,
  }
}

describe("board deletion cascade", () => {
  test("a card pushed for a deleted board is tombstoned with it", async () => {
    await client.dashboards.sync({
      since: 0,
      changes: [{ store: "dashboards", record: dashboard("b1", now) }],
    })

    // A peer that hasn't pulled the deletion pushes a card it made before it.
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1") }],
    })

    const [row] = await getDB().select().from(cards)
    expect(row.deletedAt).toBe(now)
  })

  test("the cascade ignores the card's clock, so a restore has to revive the board first", async () => {
    await client.dashboards.sync({
      since: 0,
      changes: [{ store: "dashboards", record: dashboard("b1", now) }],
    })

    // A revived card arriving while the board is still deleted server-side.
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        { store: "cards", record: { ...card("card1"), updatedAt: now + 1 } },
      ],
    })
    expect((await getDB().select().from(cards))[0].deletedAt).toBe(now)

    // Board first, then the card: the order `DeckSync.listFirst` guarantees.
    await client.dashboards.sync({
      since: 0,
      changes: [
        {
          store: "dashboards",
          record: { ...dashboard("b1", null), updatedAt: now + 1 },
        },
      ],
    })
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        { store: "cards", record: { ...card("card1"), updatedAt: now + 2 } },
      ],
    })

    expect((await getDB().select().from(cards))[0].deletedAt).toBeNull()
  })
})

describe("purgeExpired", () => {
  test("removes tombstones past retention and keeps the rest", async () => {
    const db = getDB()
    const stale = now - RETENTION_MS - 1
    const fresh = now - 1

    await db.insert(dashboards).values([
      { ...dashboard("live", null), seq: 1 },
      { ...dashboard("fresh", fresh), seq: 2 },
      { ...dashboard("stale", stale), seq: 3 },
    ])
    await db.insert(columns).values([
      {
        id: "c1",
        boardId: "stale",
        title: "Todo",
        position: "a",
        collapsed: false,
        color: "",
        done: false,
        updatedAt: now,
        deletedAt: stale,
        seq: 1,
      },
    ])
    await db.insert(cards).values([
      { ...card("keep"), boardId: "live", seq: 1 },
      { ...card("recent"), boardId: "live", deletedAt: fresh, seq: 2 },
      {
        ...card("gone"),
        boardId: "stale",
        deletedAt: stale,
        attachments: [
          {
            id: "a1",
            name: "n.png",
            key: "att/n.png",
            mime: "image/png",
            size: 1,
          },
        ],
        seq: 3,
      },
    ])

    const result = await purgeExpired(now)

    expect(result).toMatchObject({ cards: 1, columns: 1, dashboards: 1 })
    expect(result.attachments).toEqual(["att/n.png"])
    expect((await db.select().from(cards)).map((r) => r.id).sort()).toEqual([
      "keep",
      "recent",
    ])
    expect(
      (await db.select().from(dashboards)).map((r) => r.id).sort()
    ).toEqual(["fresh", "live"])
    expect(await db.select().from(columns)).toHaveLength(0)
  })

  test("drops history rows past retention, keeps newer", async () => {
    const db = getDB()
    const row = (id: string, createdAt: number) => ({
      id,
      boardId: "b1",
      entityId: "card1",
      entityType: "card" as const,
      userId: null,
      action: "edit" as const,
      data: {},
      createdAt,
      updatedAt: createdAt,
      seq: 1,
    })
    await db
      .insert(history)
      .values([row("old", now - RETENTION_MS - 1), row("new", now - 1)])

    const result = await purgeExpired(now)

    expect(result.history).toBe(1)
    expect((await db.select().from(history)).map((r) => r.id)).toEqual(["new"])
  })
})
