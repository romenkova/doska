import { beforeAll, describe, expect, test } from "vitest"
import { startServer, type Harness } from "./harness"

let h: Harness

beforeAll(async () => {
  h = await startServer()
})

describe("/api/version", () => {
  test("returns the server version", async () => {
    const res = await h.app.inject({ method: "GET", url: "/api/version" })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty("version")
  })
})
