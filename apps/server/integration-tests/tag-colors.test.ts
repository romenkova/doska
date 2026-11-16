import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { getDB } from "../src/db/get-db"
import { dashboards } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const board = (updatedAt: number, tagColors?: Record<string, string>) => ({
  store: "dashboards" as const,
  record: {
    id: "b1",
    title: "Board",
    position: "a",
    sort: [],
    ...(tagColors === undefined ? {} : { tagColors }),
    updatedAt,
    deletedAt: null,
  },
})

describe("board tag colors sync", () => {
  test("are stored and pulled back", async () => {
    const res = await client.dashboards.sync({
      since: 0,
      changes: [board(1, { bug: "rose" })],
    })

    const rows = await getDB().select().from(dashboards)
    expect(rows[0].tagColors).toEqual({ bug: "rose" })
    const pulled = res.changes.find((c) => c.record.id === "b1")
    expect(pulled?.record).toMatchObject({ tagColors: { bug: "rose" } })
  })

  test("a board from a client that predates tag colors has none", async () => {
    await client.dashboards.sync({ since: 0, changes: [board(1)] })

    const rows = await getDB().select().from(dashboards)
    expect(rows[0].tagColors).toEqual({})
  })

  test("a later push replaces the map", async () => {
    const first = await client.dashboards.sync({
      since: 0,
      changes: [board(1, { bug: "rose", ops: "blue" })],
    })
    await client.dashboards.sync({
      since: first.cursor,
      changes: [board(2, { ops: "green" })],
    })

    const rows = await getDB().select().from(dashboards)
    expect(rows[0].tagColors).toEqual({ ops: "green" })
  })
})
