import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import {
  callTool,
  dashboardTitles,
  mcpToken,
  rpcClient,
  resetTables,
  startServer,
  toolJson,
  type Harness,
  type RpcClient,
} from "./harness"

let h: Harness

beforeAll(async () => {
  h = await startServer()
})

describe("session guard", () => {
  test("a protected route with no session → 401", async () => {
    const res = await h.app.inject({ method: "GET", url: "/api/files/att/x" })
    expect(res.statusCode).toBe(401)
  })
})

describe("sign-up", () => {
  test("registering a second account is refused", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        name: "intruder",
        email: "intruder@deck.invalid",
        password: "intruder-password",
      }),
    })
    expect(res.statusCode).toBe(403)
  })

  test("the bare sign-up path is refused too", async () => {
    const res = await h.app.inject({ method: "POST", url: "/api/auth/sign-up" })
    expect(res.statusCode).toBe(403)
  })
})

describe("auth discovery", () => {
  test("serves OAuth metadata at the well-known root", async () => {
    const res = await h.app.inject({
      method: "GET",
      url: "/.well-known/oauth-authorization-server",
    })
    expect(res.statusCode).toBe(200)
    // better-auth fills in the authorization server metadata.
    expect(res.json()).toHaveProperty("issuer")
  })
})

describe("mcp", () => {
  test("an unauthenticated MCP request gets a bearer challenge", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/mcp",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    })
    expect(res.statusCode).toBe(401)
    expect(res.headers["www-authenticate"]).toContain("resource_metadata")
  })
})

describe("mcp is scoped to its token's user", () => {
  const call = (token: string, name: string, args?: Record<string, unknown>) =>
    callTool(h, token, name, args)

  let ownerToken: string
  let secondToken: string
  let owner: RpcClient
  let second: RpcClient

  beforeAll(async () => {
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
    const secondCookie = signIn.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ")

    ownerToken = await mcpToken(h, h.cookie)
    secondToken = await mcpToken(h, secondCookie)
    owner = rpcClient(h)
    second = rpcClient({ app: h.app, cookie: secondCookie })
  })

  beforeEach(resetTables)

  test("list_boards shows only the token holder's boards", async () => {
    const mine = toolJson(
      await call(ownerToken, "create_board", {
        title: "Owner's roadmap",
      })
    )
    const theirs = toolJson(
      await call(secondToken, "create_board", {
        title: "Second's roadmap",
      })
    )

    expect(
      toolJson(await call(ownerToken, "list_boards")).map(titleOf)
    ).toEqual(["Owner's roadmap"])
    expect(
      toolJson(await call(secondToken, "list_boards")).map(titleOf)
    ).toEqual(["Second's roadmap"])
    expect(mine.board.id).not.toBe(theirs.board.id)
  })

  test("get_board on someone else's board is a tool error, not a 500", async () => {
    const created = toolJson(
      await call(ownerToken, "create_board", {
        title: "Owner's roadmap",
      })
    )

    const result = await call(secondToken, "get_board", {
      boardId: created.board.id,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain(created.board.id)
  })

  // create_card reads the board before it writes, so this is the store's own
  // 403 coming back — not the missing-board check list_boards already gives.
  test("create_card on someone else's board is refused and writes nothing", async () => {
    const created = toolJson(
      await call(ownerToken, "create_board", {
        title: "Owner's roadmap",
      })
    )
    const boardId: string = created.board.id
    const columnId: string = created.columns[0].id

    const result = await call(secondToken, "create_card", {
      boardId,
      columnId,
      title: "Written by an intruder",
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain(boardId)

    const board = await owner.board.sync({ boardId, since: 0, changes: [] })
    expect(board.changes.filter((c) => c.store === "cards")).toHaveLength(0)
  })

  test("a card written over MCP reaches its own account's web client only", async () => {
    const created = toolJson(
      await call(secondToken, "create_board", {
        title: "Second's roadmap",
      })
    )
    const columnId: string = created.columns[0].id

    const card = toolJson(
      await call(secondToken, "create_card", {
        boardId: created.board.id,
        columnId,
        title: "Written by an agent",
      })
    )

    const list = await second.dashboards.sync({ since: 0, changes: [] })
    expect(list.changes.map((c) => c.record.id)).toEqual([created.board.id])
    const board = await second.board.sync({
      boardId: created.board.id,
      since: 0,
      changes: [],
    })
    expect(board.changes.map((c) => c.record.id)).toContain(card.id)

    const ownersList = await owner.dashboards.sync({ since: 0, changes: [] })
    expect(ownersList.changes).toHaveLength(0)
  })

  test("a board the web client made is writable over that account's MCP token", async () => {
    await second.dashboards.sync({
      since: 0,
      changes: [
        {
          store: "dashboards",
          record: {
            id: "b1",
            title: "From the web app",
            position: "a",
            updatedAt: 1_000,
            deletedAt: null,
          },
        },
      ],
    })

    const renamed = toolJson(
      await call(secondToken, "rename_board", {
        boardId: "b1",
        title: "Renamed by an agent",
      })
    )
    expect(renamed.title).toBe("Renamed by an agent")

    const list = await second.dashboards.sync({ since: 0, changes: [] })
    expect(dashboardTitles(list.changes)).toEqual(["Renamed by an agent"])
  })
})

const titleOf = (board: { title: string }): string => board.title
