import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { getDB } from "../src/db/get-db"
import { sidebarLayouts } from "../src/db/schema"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let owner: ReturnType<typeof rpcClient>
let second: ReturnType<typeof rpcClient>

const now = 1_000

const layout = (folderTitle: string, updatedAt = now) => ({
  store: "sidebar" as const,
  record: {
    id: "layout" as const,
    items: [
      {
        type: "folder" as const,
        id: `f-${folderTitle}`,
        title: folderTitle,
        collapsed: false,
        boardIds: ["b1"],
      },
    ],
    updatedAt,
    deletedAt: null,
  },
})

const pulledLayouts = (changes: { store: string; record: unknown }[]) =>
  changes.filter((c) => c.store === "sidebar").map((c) => c.record)

beforeAll(async () => {
  h = await startServer()
  owner = rpcClient(h)

  await auth.api.createUser({
    body: {
      name: "second",
      email: "second@deck.invalid",
      password: "second-password",
      data: { username: "second", displayUsername: "second" },
    },
    headers: new Headers({ cookie: h.cookie }),
  })

  const signIn = await auth.api.signInUsername({
    body: { username: "second", password: "second-password" },
    asResponse: true,
  })
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  second = rpcClient({ app: h.app, cookie })
})

beforeEach(resetTables)

describe("sidebar layout on dashboards.sync", () => {
  test("a pushed layout comes back to its owner, past the cursor", async () => {
    const pushed = await owner.dashboards.sync({
      since: 0,
      changes: [layout("Work")],
    })
    expect(pushed.cursor).toBeGreaterThan(0)
    expect(pulledLayouts(pushed.changes)).toEqual([layout("Work").record])

    const later = await owner.dashboards.sync({
      since: pushed.cursor,
      changes: [],
    })
    expect(pulledLayouts(later.changes)).toEqual([])

    const rows = await getDB().select().from(sidebarLayouts)
    expect(rows).toHaveLength(1)
    expect(rows[0].items).toEqual(layout("Work").record.items)
  })

  test("accounts never see each other's layouts", async () => {
    await owner.dashboards.sync({ since: 0, changes: [layout("Work")] })

    const theirs = await second.dashboards.sync({ since: 0, changes: [] })
    expect(pulledLayouts(theirs.changes)).toEqual([])

    await second.dashboards.sync({ since: 0, changes: [layout("Home")] })

    const ownerSees = await owner.dashboards.sync({ since: 0, changes: [] })
    const secondSees = await second.dashboards.sync({ since: 0, changes: [] })
    expect(pulledLayouts(ownerSees.changes)).toEqual([layout("Work").record])
    expect(pulledLayouts(secondSees.changes)).toEqual([layout("Home").record])
  })

  test("an older updatedAt loses", async () => {
    await owner.dashboards.sync({ since: 0, changes: [layout("New", now + 5)] })
    await owner.dashboards.sync({ since: 0, changes: [layout("Stale", now)] })

    const res = await owner.dashboards.sync({ since: 0, changes: [] })
    expect(pulledLayouts(res.changes)).toEqual([layout("New", now + 5).record])
  })
})
