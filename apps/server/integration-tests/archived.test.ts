import { CARD_GROUPS, type Card } from "@doska/contract"
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

const created = 1

const stampAll = (at: number) =>
  Object.fromEntries(CARD_GROUPS.map((g) => [g, at])) as Card["stamps"]

function card(patch: Partial<Card> = {}): Card {
  return {
    id: "card1",
    title: "Card",
    body: "",
    position: "a",
    columnId: "c1",
    number: null,
    deadline: null,
    priority: "",
    tags: [],
    users: [],
    attachments: [],
    template: false,
    archived: false,
    updatedAt: created,
    deletedAt: null,
    stamps: stampAll(created),
    bodyConflict: null,
    ...patch,
  }
}

const pushCard = (record: Card) =>
  client.board.sync({
    boardId: "b1",
    since: 0,
    changes: [{ store: "cards", record }],
  })

async function readCard(): Promise<Card> {
  const res = await client.board.sync({ boardId: "b1", since: 0, changes: [] })
  const hit = res.changes.find((c) => c.store === "cards")
  if (!hit || hit.store !== "cards") throw new Error("card1 not on the board")
  return hit.record
}

describe("card archive sync", () => {
  test("the flag is stored and pulled back", async () => {
    await pushCard(card({ archived: true }))

    const rows = await getDB().select().from(cards)
    expect(rows[0].archived).toBe(true)
    expect((await readCard()).archived).toBe(true)
  })

  test("a card from a client that predates archiving isn't archived", async () => {
    const old: Partial<Card> = card()
    delete old.archived
    await pushCard(old as Card)

    const rows = await getDB().select().from(cards)
    expect(rows[0].archived).toBe(false)
  })

  test("archiving on one device and retitling on another both land", async () => {
    await pushCard(card())
    const archived = card({
      archived: true,
      updatedAt: 10,
      stamps: { ...stampAll(created), archived: 10 },
    })
    const retitled = card({
      title: "Renamed",
      updatedAt: 11,
      stamps: { ...stampAll(created), title: 11 },
    })

    await pushCard(archived)
    await pushCard(retitled)

    const stored = await readCard()
    expect(stored.archived).toBe(true)
    expect(stored.title).toBe("Renamed")
  })
})
