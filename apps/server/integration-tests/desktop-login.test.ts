import { beforeAll, describe, expect, test } from "vitest"
import { startServer, type Harness } from "./harness"

let h: Harness

beforeAll(async () => {
  h = await startServer()
})

async function start(): Promise<{ id: string; secret: string }> {
  const res = await h.app.inject({ method: "POST", url: "/api/desktop-login" })
  expect(res.statusCode).toBe(200)
  const body = res.json()
  expect(body.url.endsWith(`/sign-in?desktop=${body.id}`)).toBe(true)
  return body
}

function poll(id: string, secret: string) {
  return h.app.inject({
    method: "POST",
    url: `/api/desktop-login/${id}/token`,
    headers: { "x-desktop-login-secret": secret },
  })
}

describe("desktop login", () => {
  test("the browser's session becomes a token the app can sign in with", async () => {
    const { id, secret } = await start()

    const before = await poll(id, secret)
    expect(before.json()).toEqual({ token: null })

    const complete = await h.app.inject({
      method: "POST",
      url: `/api/desktop-login/${id}/complete`,
      headers: { cookie: h.cookie },
    })
    expect(complete.statusCode).toBe(204)

    const after = await poll(id, secret)
    const { token } = after.json()
    expect(typeof token).toBe("string")

    const me = await h.app.inject({
      method: "GET",
      url: "/api/auth/get-session",
      headers: { authorization: `Bearer ${token}` },
    })
    expect(me.statusCode).toBe(200)
    expect(me.json().user.username).toBe(process.env.AUTH_LOGIN ?? "tester")

    // Spent: the token is handed out once.
    const again = await poll(id, secret)
    expect(again.statusCode).toBe(404)
  })

  test("completing needs a session, polling needs the secret", async () => {
    const { id, secret } = await start()

    const anonymous = await h.app.inject({
      method: "POST",
      url: `/api/desktop-login/${id}/complete`,
    })
    expect(anonymous.statusCode).toBe(401)

    const wrongSecret = await poll(id, "not-it")
    expect(wrongSecret.statusCode).toBe(404)

    const unknownId = await poll("nope", secret)
    expect(unknownId.statusCode).toBe(404)
  })
})
