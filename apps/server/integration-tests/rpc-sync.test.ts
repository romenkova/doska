import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { getDB } from "../src/db/get-db"
import { cards, dashboards } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const now = 1_000

function card(id: string, columnId: string, updatedAt = now) {
  return {
    id,
    title: id,
    body: "",
    position: "a",
    columnId,
    number: null,
    deadline: null,
    attachments: [],
    updatedAt,
    deletedAt: null,
  }
}

describe("board.sync", () => {
  test("pushes changes and reads them back past the cursor", async () => {
    const res = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        { store: "columns", record: {
          id: "c1", title: "Todo", position: "a",
          dashboardId: "b1", collapsed: false, updatedAt: now, deletedAt: null,
        } },
        { store: "cards", record: card("card1", "c1") },
      ],
    })

    expect(res.cursor).toBeGreaterThan(0)
    expect(res.changes).toHaveLength(2)

    // Landed in the DB, not just echoed back.
    const rows = await getDB().select().from(cards)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe("card1")
    expect(rows[0].boardId).toBe("b1")
  })

  test("a later cursor pulls only newer records", async () => {
    const first = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", "c1") }],
    })

    const second = await client.board.sync({
      boardId: "b1",
      since: first.cursor,
      changes: [{ store: "cards", record: card("card2", "c1", now + 1) }],
    })

    expect(second.changes.map((c) => c.record.id)).toEqual(["card2"])
  })

  test("scopes reads to the requested board", async () => {
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", "c1") }],
    })

    const other = await client.board.sync({
      boardId: "b2",
      since: 0,
      changes: [],
    })
    expect(other.changes).toHaveLength(0)
  })
})

describe("dashboards.sync", () => {
  test("pushes and reads a dashboard on the account-level channel", async () => {
    const res = await client.dashboards.sync({
      since: 0,
      changes: [
        { store: "dashboards", record: {
          id: "b1", title: "Roadmap", position: "a",
          prefix: "ROAD", updatedAt: now, deletedAt: null,
        } },
      ],
    })

    expect(res.cursor).toBeGreaterThan(0)
    expect(res.changes.map((c) => c.record.id)).toEqual(["b1"])

    const rows = await getDB().select().from(dashboards)
    expect(rows).toHaveLength(1)
    expect(rows[0].prefix).toBe("ROAD")
  })
})

describe("guard", () => {
  test("rejects an unauthenticated RPC call with 401", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/rpc/board/sync",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ boardId: "b1", since: 0, changes: [] }),
    })
    expect(res.statusCode).toBe(401)
  })
})
