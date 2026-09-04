import { eq } from "drizzle-orm"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { getDB } from "../src/db/get-db"
import { dashboards } from "../src/db/schema"
import {
  dashboardTitles,
  rpcClient,
  resetTables,
  startServer,
  type Harness,
} from "./harness"

let h: Harness
let owner: ReturnType<typeof rpcClient>
let second: ReturnType<typeof rpcClient>

const now = 1_000

const board = (id: string, title: string, updatedAt = now) => ({
  store: "dashboards" as const,
  record: {
    id,
    title,
    position: "a",
    updatedAt,
    deletedAt: null,
  },
})

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

describe("dashboards.sync is scoped to the owner", () => {
  test("a second account sees none of the owner's boards", async () => {
    await owner.dashboards.sync({
      since: 0,
      changes: [board("b1", "Roadmap"), board("b2", "Personal")],
    })

    const res = await second.dashboards.sync({ since: 0, changes: [] })

    expect(res.changes).toHaveLength(0)
  })

  test("the owner does not see the second account's board", async () => {
    await owner.dashboards.sync({ since: 0, changes: [board("b1", "Roadmap")] })
    await second.dashboards.sync({ since: 0, changes: [board("b2", "Theirs")] })

    const res = await owner.dashboards.sync({ since: 0, changes: [] })

    expect(res.changes.map((c) => c.record.id)).toEqual(["b1"])
  })

  test("each account's own boards round-trip", async () => {
    const first = await owner.dashboards.sync({
      since: 0,
      changes: [board("b1", "Roadmap")],
    })
    expect(dashboardTitles(first.changes)).toEqual(["Roadmap"])

    const theirs = await second.dashboards.sync({
      since: 0,
      changes: [board("b2", "Theirs")],
    })
    expect(dashboardTitles(theirs.changes)).toEqual(["Theirs"])

    // And past a cursor: neither account is handed the other's write.
    const renamed = await owner.dashboards.sync({
      since: first.cursor,
      changes: [board("b1", "Renamed", now + 1)],
    })
    expect(dashboardTitles(renamed.changes)).toEqual(["Renamed"])
  })

  test("a push naming another account's board is dropped, not failed", async () => {
    await second.dashboards.sync({ since: 0, changes: [board("b2", "Theirs")] })

    const res = await owner.dashboards.sync({
      since: 0,
      changes: [board("b2", "Stolen", now + 1)],
    })

    expect(res.changes).toHaveLength(0)

    const [row] = await getDB()
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, "b2"))
    expect(row.title).toBe("Theirs")
  })
})
