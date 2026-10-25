import { CARD_GROUPS, type Card } from "@doska/contract"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { env } from "../src/env"
import { getDB } from "../src/db/get-db"
import { cards, dashboards } from "../src/db/schema"
import {
  callTool,
  mcpToken,
  rpcClient,
  resetTables,
  startServer,
  toolJson,
  type Harness,
} from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>
let token: string

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
  token = await mcpToken(h, h.cookie)
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

const board = (template?: boolean) => ({
  store: "dashboards" as const,
  record: {
    id: "b1",
    title: "Board",
    position: "a",
    sort: [],
    ...(template === undefined ? {} : { template }),
    updatedAt: created,
    deletedAt: null,
  },
})

describe("card template sync", () => {
  test("the flag is stored and pulled back", async () => {
    await pushCard(card({ template: true }))

    const rows = await getDB().select().from(cards)
    expect(rows[0].template).toBe(true)
    expect((await readCard()).template).toBe(true)
  })

  test("a card from a client that predates templates isn't one", async () => {
    const old: Partial<Card> = card()
    delete old.template
    await pushCard(old as Card)

    const rows = await getDB().select().from(cards)
    expect(rows[0].template).toBe(false)
  })

  test("marking a template on one device and retitling on another both land", async () => {
    await pushCard(card())
    const marked = card({
      template: true,
      updatedAt: 10,
      stamps: { ...stampAll(created), template: 10 },
    })
    const retitled = card({
      title: "Renamed",
      updatedAt: 11,
      stamps: { ...stampAll(created), title: 11 },
    })

    await pushCard(marked)
    await pushCard(retitled)

    const stored = await readCard()
    expect(stored.template).toBe(true)
    expect(stored.title).toBe("Renamed")
  })
})

describe("board template sync", () => {
  test("the flag is stored and pulled back", async () => {
    const res = await client.dashboards.sync({
      since: 0,
      changes: [board(true)],
    })

    const rows = await getDB().select().from(dashboards)
    expect(rows[0].template).toBe(true)
    const pulled = res.changes.find((c) => c.record.id === "b1")
    expect((pulled?.record as { template: boolean }).template).toBe(true)
  })

  test("a board from a client that predates templates isn't one", async () => {
    await client.dashboards.sync({ since: 0, changes: [board()] })

    const rows = await getDB().select().from(dashboards)
    expect(rows[0].template).toBe(false)
  })
})

describe("/api/sso authRequired", () => {
  // env is read-only in the app; the test flips it like a reboot with ALWAYS_AUTH would
  const flags = env as { authRequired: boolean }

  async function readWith(authRequired: boolean) {
    const before = flags.authRequired
    flags.authRequired = authRequired
    try {
      return (await h.app.inject({ method: "GET", url: "/api/sso" })).json()
    } finally {
      flags.authRequired = before
    }
  }

  test("reports it when the server requires sign-in", async () => {
    expect(await readWith(true)).toMatchObject({ authRequired: true })
  })

  test("reports it off with ALWAYS_AUTH=false", async () => {
    expect(await readWith(false)).toMatchObject({ authRequired: false })
  })
})

describe("templates over MCP", () => {
  test("boards and cards it creates aren't templates", async () => {
    const board = toolJson(
      await callTool(h, token, "create_board", { title: "Roadmap" })
    )
    await callTool(h, token, "create_card", {
      boardId: board.board.id,
      columnId: board.columns[0].id,
      title: "Card",
    })

    const [boardRow] = await getDB().select().from(dashboards)
    const [cardRow] = await getDB().select().from(cards)
    expect(boardRow.template).toBe(false)
    expect(cardRow.template).toBe(false)
  })
})
