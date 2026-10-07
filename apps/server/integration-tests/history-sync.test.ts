import type { HistoryEntry } from "@doska/contract"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { getDB } from "../src/db/get-db"
import { history } from "../src/db/schema"
import { writeMembers } from "../src/db/sync/members"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let ownerId: string
let memberId: string
let owner: ReturnType<typeof rpcClient>
let member: ReturnType<typeof rpcClient>

const now = 1_000_000_000_000

const board = (id: string) => ({
  store: "dashboards" as const,
  record: { id, title: id, position: "a", updatedAt: now, deletedAt: null },
})

const entry = (id: string, overrides: Partial<HistoryEntry> = {}) => ({
  id,
  boardId: "b1",
  entityId: "card1",
  entityType: "card" as const,
  userId: null,
  action: "edit" as const,
  data: { fields: ["title"] },
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  ...overrides,
})

beforeAll(async () => {
  h = await startServer()
  owner = rpcClient(h)

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: h.cookie }),
  })
  ownerId = session!.user.id

  const created = await auth.api.createUser({
    body: {
      name: "member",
      email: "member@deck.invalid",
      password: "member-password",
      data: { username: "member", displayUsername: "member" },
    },
    headers: new Headers({ cookie: h.cookie }),
  })
  memberId = created.user.id

  const signIn = await auth.api.signInUsername({
    body: { username: "member", password: "member-password" },
    asResponse: true,
  })
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  member = rpcClient({ app: h.app, cookie })
})

beforeEach(async () => {
  await resetTables()
  await owner.dashboards.sync({ since: 0, changes: [board("b1")] })
})

describe("history.sync", () => {
  test("a pushed row comes back once, then the cursor is past it", async () => {
    const pushed = await owner.history.sync({
      since: 0,
      changes: [entry("h1")],
    })
    expect(pushed.changes).toEqual([{ ...entry("h1"), userId: ownerId }])

    const later = await owner.history.sync({
      since: pushed.cursor,
      changes: [],
    })
    expect(later.changes).toEqual([])
  })

  test("the server sets userId from the session", async () => {
    await owner.history.sync({
      since: 0,
      changes: [entry("h1", { userId: "someone-else" })],
    })
    const [row] = await getDB().select().from(history)
    expect(row.userId).toBe(ownerId)
  })

  test("pushing to a board without access is 403", async () => {
    await expect(
      member.history.sync({ since: 0, changes: [entry("h1")] })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  test("a member sees the owner's rows until revoked", async () => {
    await writeMembers([{ boardId: "b1", userId: memberId }], now)
    const first = await owner.history.sync({
      since: 0,
      changes: [entry("h1")],
    })
    const seen = await member.history.sync({ since: 0, changes: [] })
    expect(seen.changes.map((c) => c.id)).toEqual(["h1"])

    await writeMembers(
      [{ boardId: "b1", userId: memberId, revokedAt: now + 1 }],
      now + 1
    )
    await owner.history.sync({ since: first.cursor, changes: [entry("h2")] })
    const after = await member.history.sync({
      since: seen.cursor,
      changes: [],
    })
    expect(after.changes).toEqual([])
  })

  test("nobody overwrites someone else's row", async () => {
    await writeMembers([{ boardId: "b1", userId: memberId }], now)
    await owner.history.sync({ since: 0, changes: [entry("h1")] })

    await member.history.sync({
      since: 0,
      changes: [
        entry("h1", { data: { fields: ["body"] }, updatedAt: now + 1 }),
      ],
    })

    const [row] = await getDB().select().from(history)
    expect(row.data).toEqual({ fields: ["title"] })
    expect(row.userId).toBe(ownerId)
  })

  test("the author's newer push updates the row", async () => {
    await owner.history.sync({ since: 0, changes: [entry("h1")] })
    await owner.history.sync({
      since: 0,
      changes: [
        entry("h1", { data: { fields: ["body"] }, updatedAt: now + 1 }),
      ],
    })

    const [row] = await getDB().select().from(history)
    expect(row.data).toEqual({ fields: ["body"] })
  })
})
