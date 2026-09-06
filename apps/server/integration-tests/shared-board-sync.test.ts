import { ORPCError } from "@orpc/client"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import {
  dashboardTitles,
  rpcClient,
  resetTables,
  startServer,
  type Harness,
} from "./harness"

let h: Harness
let owner: ReturnType<typeof rpcClient>
let member: ReturnType<typeof rpcClient>
let stranger: ReturnType<typeof rpcClient>
let memberId: string

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

const column = (id: string, title: string, dashboardId = "b1") => ({
  store: "columns" as const,
  record: {
    id,
    title,
    position: "a",
    dashboardId,
    collapsed: false,
    color: "",
    done: false,
    updatedAt: now,
    deletedAt: null,
  },
})

const card = (id: string, title: string, columnId = "c1", updatedAt = now) => ({
  store: "cards" as const,
  record: {
    id,
    title,
    body: "",
    position: "a",
    columnId,
    number: null,
    deadline: null,
    attachments: [],
    updatedAt,
    deletedAt: null,
  },
})

async function statusOf(run: Promise<unknown>): Promise<number | undefined> {
  try {
    await run
    return undefined
  } catch (err) {
    return err instanceof ORPCError ? err.status : -1
  }
}

async function signIn(username: string, password: string) {
  const res = await auth.api.signInUsername({
    body: { username, password },
    asResponse: true,
  })
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  return rpcClient({ app: h.app, cookie })
}

async function createAccount(username: string): Promise<string> {
  const created = await auth.api.createUser({
    body: {
      name: username,
      email: `${username}@deck.invalid`,
      password: `${username}-password`,
      data: { username, displayUsername: username },
    },
    headers: new Headers({ cookie: h.cookie }),
  })
  return created.user.id
}

beforeAll(async () => {
  h = await startServer()
  owner = rpcClient(h)

  memberId = await createAccount("member")
  await createAccount("stranger")

  member = await signIn("member", "member-password")
  stranger = await signIn("stranger", "stranger-password")
})

beforeEach(async () => {
  await resetTables()
  await owner.dashboards.sync({ since: 0, changes: [board("b1", "Roadmap")] })
  await owner.board.sync({
    boardId: "b1",
    since: 0,
    changes: [column("c1", "Todo"), card("k1", "Ship it")],
  })
})

describe("a shared board reaches the member's list", () => {
  // The whole point of stamping membership rows from the board-list counter.
  // Starting from `since: 0` would pass on the board's own `seq` and prove
  // nothing, so the member's cursor is moved past it first.
  test("arrives past a cursor the board's own seq already fell below", async () => {
    const caughtUp = await member.dashboards.sync({ since: 0, changes: [] })
    expect(caughtUp.changes).toHaveLength(0)
    expect(caughtUp.cursor).toBeGreaterThan(0)

    await owner.members.add({ boardId: "b1", userId: memberId })

    const res = await member.dashboards.sync({
      since: caughtUp.cursor,
      changes: [],
    })
    expect(dashboardTitles(res.changes)).toEqual(["Roadmap"])
    expect(res.removed).toEqual([])
  })

  test("the owner's other boards stay out of it", async () => {
    await owner.dashboards.sync({
      since: 0,
      changes: [board("b2", "Personal")],
    })
    await owner.members.add({ boardId: "b1", userId: memberId })

    const res = await member.dashboards.sync({ since: 0, changes: [] })
    expect(res.changes.map((c) => c.record.id)).toEqual(["b1"])
  })

  test("later edits to a shared board reach the member on the board's own seq", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    const caughtUp = await member.dashboards.sync({ since: 0, changes: [] })

    await owner.dashboards.sync({
      since: 0,
      changes: [board("b1", "Renamed", now + 1)],
    })

    const res = await member.dashboards.sync({
      since: caughtUp.cursor,
      changes: [],
    })
    expect(dashboardTitles(res.changes)).toEqual(["Renamed"])
  })
})

describe("a member on the board channel", () => {
  test("reads the board's contents and writes to it", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })

    const read = await member.board.sync({
      boardId: "b1",
      since: 0,
      changes: [],
    })
    expect(read.changes.map((c) => c.record.id).sort()).toEqual(["c1", "k1"])

    await member.board.sync({
      boardId: "b1",
      since: read.cursor,
      changes: [card("k2", "Added by the member")],
    })

    const back = await owner.board.sync({
      boardId: "b1",
      since: 0,
      changes: [],
    })
    expect(back.changes.map((c) => c.record.id).sort()).toEqual([
      "c1",
      "k1",
      "k2",
    ])
  })

  test("both accounts' edits land — last-writer-wins is per record", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })

    await member.board.sync({
      boardId: "b1",
      since: 0,
      changes: [card("k1", "Member's title", "c1", now + 1)],
    })
    await owner.board.sync({
      boardId: "b1",
      since: 0,
      changes: [card("k2", "Owner's card", "c1", now + 1)],
    })

    const res = await member.board.sync({
      boardId: "b1",
      since: 0,
      changes: [],
    })
    const titles = Object.fromEntries(
      res.changes.map((c) => [c.record.id, c.record.title])
    )
    expect(titles.k1).toBe("Member's title")
    expect(titles.k2).toBe("Owner's card")
  })

  test("a non-member is still refused", async () => {
    expect(
      await statusOf(
        stranger.board.sync({ boardId: "b1", since: 0, changes: [] })
      )
    ).toBe(403)
  })
})

describe("revocation", () => {
  test("hands the board id back in `removed`", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    const shared = await member.dashboards.sync({ since: 0, changes: [] })
    expect(shared.changes).toHaveLength(1)

    await owner.members.remove({ boardId: "b1", userId: memberId })

    const res = await member.dashboards.sync({
      since: shared.cursor,
      changes: [],
    })
    expect(res.removed).toEqual(["b1"])
    // The board must not travel as a change as well: it is gone, not renamed.
    expect(res.changes).toHaveLength(0)
  })

  test("closes the board channel behind it", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    await member.board.sync({ boardId: "b1", since: 0, changes: [] })

    await owner.members.remove({ boardId: "b1", userId: memberId })

    expect(
      await statusOf(
        member.board.sync({ boardId: "b1", since: 0, changes: [] })
      )
    ).toBe(403)
  })

  test("stays reported only until the member's cursor passes it", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    await owner.members.remove({ boardId: "b1", userId: memberId })

    const first = await member.dashboards.sync({ since: 0, changes: [] })
    expect(first.removed).toEqual(["b1"])

    const second = await member.dashboards.sync({
      since: first.cursor,
      changes: [],
    })
    expect(second.removed).toEqual([])
  })

  test("leaves the owner's own view untouched", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    await owner.members.remove({ boardId: "b1", userId: memberId })

    const res = await owner.dashboards.sync({ since: 0, changes: [] })
    expect(res.changes.map((c) => c.record.id)).toEqual(["b1"])
    expect(res.removed).toEqual([])
  })

  test("re-adding brings the board back with its contents", async () => {
    await owner.members.add({ boardId: "b1", userId: memberId })
    await owner.members.remove({ boardId: "b1", userId: memberId })
    const gone = await member.dashboards.sync({ since: 0, changes: [] })
    expect(gone.changes).toHaveLength(0)

    await owner.members.add({ boardId: "b1", userId: memberId })

    const res = await member.dashboards.sync({
      since: gone.cursor,
      changes: [],
    })
    expect(dashboardTitles(res.changes)).toEqual(["Roadmap"])
    expect(res.removed).toEqual([])

    // From zero, because the member's board cursor was dropped with the board.
    const contents = await member.board.sync({
      boardId: "b1",
      since: 0,
      changes: [],
    })
    expect(contents.changes.map((c) => c.record.id).sort()).toEqual([
      "c1",
      "k1",
    ])
  })
})
