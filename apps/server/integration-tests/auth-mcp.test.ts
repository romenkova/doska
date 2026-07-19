import { beforeAll, describe, expect, test } from "vitest"
import { startServer, type Harness } from "./harness"

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
