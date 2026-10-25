import { beforeEach, describe, expect, it } from "vitest"
import { CARDS, COLUMNS, DASHBOARDS } from "../src/api/constants"
import type { Card, Column, Dashboard } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const board = (id: string, deletedAt: number | null = null) => ({
  id,
  title: id,
  position: "a0",
  sort: [],
  template: true,
  updatedAt: 1,
  deletedAt,
})
const column = (
  id: string,
  dashboardId: string,
  position: string,
  deletedAt: number | null = null
) => ({
  id,
  title: id,
  dashboardId,
  position,
  collapsed: false,
  done: false,
  color: "",
  stamps: { title: 1 },
  updatedAt: 1,
  deletedAt,
})
const attachment = { id: "att", name: "a.png", key: "att/1", mime: "", size: 1 }
const card = (id: string, columnId: string, patch: Partial<Card> = {}) => ({
  id,
  columnId,
  position: "a0",
  title: id,
  body: "notes",
  number: 4,
  deadline: "2026-11-01",
  priority: "high",
  tags: ["ops"],
  users: ["user-1"],
  attachments: [attachment],
  template: false,
  stamps: { title: 1 },
  bodyConflict: null,
  updatedAt: 1,
  deletedAt: null,
  ...patch,
})

const all = <T>(store: string) =>
  [...rows.entries()]
    .filter(([key]) => key.startsWith(`${store}/`))
    .map(([, value]) => value as T)

beforeEach(installMemoryRuntime)

describe("createDashboard", () => {
  it("without a template, gets the default columns and no cards", async () => {
    const { createDashboard } =
      await import("../src/api/operations/create-dashboard")
    const created = await createDashboard("Fresh")

    const columns = all<Column>(COLUMNS).filter(
      (c) => c.dashboardId === created.id
    )
    expect(columns.map((c) => c.title).sort()).toEqual(
      ["Done", "In Progress", "To Do"].sort()
    )
    expect(all<Card>(CARDS)).toEqual([])
    expect(created.template).toBe(false)
  })

  it("from a template, copies its live columns and cards onto the new board", async () => {
    rows.set(`${DASHBOARDS}/tpl`, board("tpl"))
    rows.set(`${COLUMNS}/backlog`, column("backlog", "tpl", "a0"))
    rows.set(`${COLUMNS}/shipped`, column("shipped", "tpl", "a1"))
    rows.set(`${COLUMNS}/gone`, column("gone", "tpl", "a2", 5))
    rows.set(`${CARDS}/plan`, card("plan", "backlog"))
    rows.set(`${CARDS}/old`, card("old", "backlog", { deletedAt: 5 }))
    rows.set(`${CARDS}/lost`, card("lost", "gone"))

    const { createDashboard } =
      await import("../src/api/operations/create-dashboard")
    const created = await createDashboard("Copy", "tpl")

    expect(created.id).not.toBe("tpl")
    expect(created.template).toBe(false)

    const columns = all<Column>(COLUMNS).filter(
      (c) => c.dashboardId === created.id
    )
    expect(columns.map((c) => c.title).sort()).toEqual(["backlog", "shipped"])
    for (const c of columns) {
      expect(["backlog", "shipped"]).not.toContain(c.id)
      expect(c.deletedAt).toBeNull()
    }

    const backlog = columns.find((c) => c.title === "backlog")!
    const copies = all<Card>(CARDS).filter((c) => c.columnId === backlog.id)
    expect(copies).toHaveLength(1)
    const [copy] = copies
    expect(copy.id).not.toBe("plan")
    expect(copy).toMatchObject({
      title: "plan",
      body: "notes",
      deadline: "2026-11-01",
      priority: "high",
      tags: ["ops"],
      // The server numbers it for its new board.
      number: null,
      users: [],
      attachments: [],
      template: false,
      deletedAt: null,
    })
    expect(copy.updatedAt).toBeGreaterThan(0)
    expect(copy.stamps.title).toBeGreaterThan(1)

    // The template board itself is left as it was.
    expect(rows.get(`${CARDS}/plan`)).toEqual(card("plan", "backlog"))
    expect(all<Card>(CARDS)).toHaveLength(4)
  })
})

describe("createCard", () => {
  it("fills the new card with the content it's given", async () => {
    rows.set(`${COLUMNS}/todo`, column("todo", "b", "a0"))

    const { createCard } = await import("../src/api/operations/create-card")
    const id = await createCard("todo", {
      title: "Weekly review",
      body: "- [ ] inbox",
      priority: "low",
      tags: ["ritual"],
      deadline: "2026-11-02",
    })

    expect(rows.get(`${CARDS}/${id}`)).toMatchObject({
      columnId: "todo",
      title: "Weekly review",
      body: "- [ ] inbox",
      priority: "low",
      tags: ["ritual"],
      deadline: "2026-11-02",
      users: [],
      attachments: [],
      template: false,
    })
  })
})

describe("setCardTemplate", () => {
  it("flips the flag and stamps only the template group", async () => {
    rows.set(`${CARDS}/plan`, card("plan", "backlog"))

    const { setCardTemplate } =
      await import("../src/api/operations/set-template")
    await setCardTemplate("plan", true)

    const stored = rows.get(`${CARDS}/plan`) as Card
    expect(stored.template).toBe(true)
    expect(stored.stamps.template).toBeGreaterThan(1)
    expect(stored.stamps.title).toBe(1)

    await setCardTemplate("plan", false)
    expect((rows.get(`${CARDS}/plan`) as Card).template).toBe(false)
  })

  it("ignores a card that doesn't exist", async () => {
    const { setCardTemplate } =
      await import("../src/api/operations/set-template")
    await setCardTemplate("missing", true)
    expect(all<Card>(CARDS)).toEqual([])
  })
})

describe("setDashboardTemplate", () => {
  it("flips the flag and bumps updatedAt", async () => {
    rows.set(`${DASHBOARDS}/b`, { ...board("b"), template: false })

    const { setDashboardTemplate } =
      await import("../src/api/operations/set-template")
    await setDashboardTemplate("b", true)

    const stored = rows.get(`${DASHBOARDS}/b`) as Dashboard
    expect(stored.template).toBe(true)
    expect(stored.updatedAt).toBeGreaterThan(1)
  })
})

describe("getTemplateCards", () => {
  it("lists template cards on live boards, with their board", async () => {
    rows.set(`${DASHBOARDS}/b`, board("b"))
    rows.set(`${DASHBOARDS}/dead`, board("dead", 5))
    rows.set(`${COLUMNS}/col`, column("col", "b", "a0"))
    rows.set(`${COLUMNS}/tombstoned`, column("tombstoned", "b", "a1", 5))
    rows.set(`${COLUMNS}/on-dead`, column("on-dead", "dead", "a0"))
    rows.set(
      `${CARDS}/second`,
      card("second", "col", { template: true, position: "a1" })
    )
    rows.set(
      `${CARDS}/first`,
      card("first", "col", { template: true, position: "a0" })
    )
    rows.set(`${CARDS}/plain`, card("plain", "col"))
    rows.set(
      `${CARDS}/deleted`,
      card("deleted", "col", { template: true, deletedAt: 5 })
    )
    rows.set(
      `${CARDS}/in-dead-col`,
      card("in-dead-col", "tombstoned", { template: true })
    )
    rows.set(
      `${CARDS}/on-dead-board`,
      card("on-dead-board", "on-dead", { template: true })
    )

    const { getTemplateCards } =
      await import("../src/api/operations/get-template-cards")
    const found = await getTemplateCards()

    expect(found.map((t) => t.card.id)).toEqual(["first", "second"])
    expect(found[0]).toMatchObject({ boardId: "b", boardTitle: "b" })
  })
})
