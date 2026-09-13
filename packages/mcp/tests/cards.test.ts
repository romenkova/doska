import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Card, Change, Column } from "@doska/contract"
import { describe, expect, it } from "vitest"
import { createBoard } from "../src/board"
import type { BoardStore } from "../src/store"
import { registerCardTools } from "../src/tools/cards"

/** Every record the server holds was last written at t=10; the tools write at t=20. */
const synced = 10
const now = 20

const column: Column = {
  id: "col-1",
  title: "Todo",
  position: "a0",
  dashboardId: "board-1",
  collapsed: false,
  color: "",
  done: false,
  updatedAt: synced,
  deletedAt: null,
  stamps: {},
}

const card: Card = {
  id: "card-1",
  title: "Card",
  body: "first line\n\n- [ ] task",
  position: "a0",
  columnId: "col-1",
  number: 1,
  deadline: null,
  priority: "",
  attachments: [],
  updatedAt: synced,
  deletedAt: null,
  stamps: {},
  bodyConflict: null,
}

class MemoryStore implements BoardStore {
  pushed: Change[] = []
  now = () => now
  readDashboards = () => Promise.resolve([])
  readBoard = () =>
    Promise.resolve<Change[]>([
      { store: "columns", record: column },
      { store: "cards", record: card },
    ])
  pushDashboards = () => Promise.resolve()
  pushBoard = (_boardId: string, changes: Change[]) => {
    this.pushed.push(...changes)
    return Promise.resolve()
  }
}

type Handler = (args: Record<string, unknown>) => Promise<unknown>

/** The card tools registered on a stand-in server, callable by name. */
function cardTools() {
  const store = new MemoryStore()
  const handlers = new Map<string, Handler>()
  const server = {
    registerTool: (name: string, _config: unknown, handler: Handler) =>
      handlers.set(name, handler),
  } as unknown as McpServer
  registerCardTools(server, createBoard(store))

  const call = (name: string, args: Record<string, unknown>) =>
    handlers.get(name)!({ boardId: "board-1", cardId: "card-1", ...args })
  const pushedCard = () => {
    const change = store.pushed[0]
    if (change?.store !== "cards") throw new Error("no card pushed")
    return change
  }
  return { call, pushedCard, store }
}

describe("update_card", () => {
  it("stamps only the field it changed", async () => {
    const { call, pushedCard } = cardTools()
    await call("update_card", { deadline: "2026-09-18" })

    const { record, baseBody } = pushedCard()
    expect(record.stamps.deadline).toBe(now)
    expect(record.stamps.body).toBe(synced)
    expect(record.stamps.title).toBe(synced)
    expect(baseBody).toBeUndefined()
  })

  it("sends the body it appended to as the merge base", async () => {
    const { call, pushedCard } = cardTools()
    await call("update_card", { append: "reviewed" })

    const { record, baseBody } = pushedCard()
    expect(record.body).toBe(`${card.body}\n\nreviewed`)
    expect(record.stamps.body).toBe(now)
    expect(record.stamps.deadline).toBe(synced)
    expect(baseBody).toBe(card.body)
  })

  it("pushes nothing when every field already has the value", async () => {
    const { call, store } = cardTools()
    await call("update_card", { title: card.title, deadline: null })

    expect(store.pushed).toEqual([])
  })
})

describe("check_task", () => {
  it("touches the body and sends the merge base", async () => {
    const { call, pushedCard } = cardTools()
    await call("check_task", { index: 0, checked: true })

    const { record, baseBody } = pushedCard()
    expect(record.body).toBe("first line\n\n- [x] task")
    expect(record.stamps.body).toBe(now)
    expect(record.stamps.title).toBe(synced)
    expect(baseBody).toBe(card.body)
  })
})

describe("move_card", () => {
  it("touches only place", async () => {
    const { call, pushedCard } = cardTools()
    await call("move_card", { place: "bottom" })

    const { record, baseBody } = pushedCard()
    expect(record.stamps.place).toBe(now)
    expect(record.stamps.body).toBe(synced)
    expect(baseBody).toBeUndefined()
  })
})

describe("delete_card", () => {
  it("touches only deleted", async () => {
    const { call, pushedCard } = cardTools()
    await call("delete_card", {})

    const { record } = pushedCard()
    expect(record.deletedAt).toBe(now)
    expect(record.stamps.deleted).toBe(now)
    expect(record.stamps.body).toBe(synced)
  })
})
