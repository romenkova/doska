import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import type { Column } from "@doska/contract"
import { getDB } from "../src/db/get-db"
import { columns } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const now = 1_000

function column(id: string, color: string) {
  return {
    id,
    title: "Todo",
    position: "a",
    dashboardId: "b1",
    collapsed: false,
    color,
    updatedAt: now,
    deletedAt: null,
  }
}

describe("column color sync", () => {
  test("persists the color to the DB and reads it back", async () => {
    const res = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "columns", record: column("c1", "violet") }],
    })

    const rows = await getDB().select().from(columns)
    expect(rows[0].color).toBe("violet")

    const pulled = res.changes.find((c) => c.record.id === "c1")
    expect((pulled?.record as { color: string }).color).toBe("violet")
  })

  test("a column pushed without a color defaults to empty, not null", async () => {
    await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        {
          store: "columns",
          // A client on the previous version sends no color at all — the cast
          // is the point of the test, so it has to defeat the schema's type.
          record: {
            id: "c2",
            title: "Todo",
            position: "a",
            dashboardId: "b1",
            collapsed: false,
            updatedAt: now,
            deletedAt: null,
          } as unknown as Column,
        },
      ],
    })

    const rows = await getDB().select().from(columns)
    expect(rows[0].color).toBe("")
  })

  test("a later push updates the color", async () => {
    const first = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "columns", record: column("c1", "violet") }],
    })

    const second = await client.board.sync({
      boardId: "b1",
      since: first.cursor,
      changes: [
        { store: "columns", record: { ...column("c1", "green"), updatedAt: now + 1 } },
      ],
    })

    const rows = await getDB().select().from(columns)
    expect(rows[0].color).toBe("green")
    expect(
      (second.changes.find((c) => c.record.id === "c1")?.record as { color: string })
        .color
    ).toBe("green")
  })
})
