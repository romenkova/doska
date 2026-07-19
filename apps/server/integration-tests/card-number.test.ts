import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { getDB } from "../src/db/get-db"
import { cards } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const now = 1_000

function card(id: string, updatedAt: number, title = id) {
  return {
    id,
    title,
    body: "",
    position: "a",
    columnId: "c1",
    // Clients never send a number; the server owns it.
    number: null,
    deadline: null,
    attachments: [],
    updatedAt,
    deletedAt: null,
  }
}

function pulled(changes: { record: { id: string } }[], id: string) {
  const hit = changes.find((c) => c.record.id === id)
  return hit?.record as { number: number | null; updatedAt: number } | undefined
}

describe("card numbers", () => {
  test("stamps a number on the first push, ahead of the pushed clock", async () => {
    const res = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", now) }],
    })

    const record = pulled(res.changes, "card1")
    expect(record?.number).toBe(1)
    // Ahead, so the pushing client can't discard it as stale.
    expect(record?.updatedAt).toBeGreaterThan(now)
  })

  /**
   * The regression this file exists for: a client that edits a card before its
   * number has arrived pushes `number: null` again. The server keeps the number
   * it already has — and has to advance the clock while doing it, or the record
   * it sends back ties with the client's own copy and the client discards it,
   * leaving the card without a number for good.
   */
  test("a later push that omits the number still gets it back, on a newer clock", async () => {
    const first = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", now) }],
    })
    const stamped = pulled(first.changes, "card1")!

    // The client retitles before that number reached it, so it pushes null.
    const editedAt = stamped.updatedAt + 100
    const second = await client.board.sync({
      boardId: "b1",
      since: first.cursor,
      changes: [{ store: "cards", record: card("card1", editedAt, "Renamed") }],
    })

    const record = pulled(second.changes, "card1")
    expect(record?.number).toBe(stamped.number)
    expect(record?.updatedAt).toBeGreaterThan(editedAt)

    const rows = await getDB().select().from(cards)
    expect(rows[0].title).toBe("Renamed")
    expect(rows[0].number).toBe(stamped.number)
  })

  test("a push that already carries the number leaves the clock alone", async () => {
    const first = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [{ store: "cards", record: card("card1", now) }],
    })
    const stamped = pulled(first.changes, "card1")!

    const editedAt = stamped.updatedAt + 100
    const second = await client.board.sync({
      boardId: "b1",
      since: first.cursor,
      changes: [
        {
          store: "cards",
          record: {
            ...card("card1", editedAt, "Renamed"),
            number: stamped.number,
          },
        },
      ],
    })

    expect(pulled(second.changes, "card1")?.updatedAt).toBe(editedAt)
  })

  test("numbers count up per board", async () => {
    const res = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [
        { store: "cards", record: card("card1", now) },
        { store: "cards", record: card("card2", now) },
      ],
    })
    expect(pulled(res.changes, "card2")?.number).toBe(2)

    const other = await client.board.sync({
      boardId: "b2",
      since: 0,
      changes: [{ store: "cards", record: card("card3", now) }],
    })
    expect(pulled(other.changes, "card3")?.number).toBe(1)
  })
})
