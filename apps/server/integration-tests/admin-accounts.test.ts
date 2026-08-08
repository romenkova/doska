import { beforeAll, describe, expect, test } from "vitest"
import { auth } from "../src/auth"
import { startServer, type Harness } from "./harness"

let h: Harness

const second = {
  name: "second",
  email: "second@deck.invalid",
  password: "second-password",
  // `createUser` takes only better-auth's core fields inline; the username
  // plugin's columns ride along in `data`.
  data: { username: "second", displayUsername: "second" },
}

beforeAll(async () => {
  h = await startServer()
})

/** `createUser` reads the caller's session off the headers, not a cookie jar. */
function asOwner(): Headers {
  return new Headers({ cookie: h.cookie })
}

describe("admin accounts", () => {
  test("the seeded owner is an admin", async () => {
    const session = await auth.api.getSession({ headers: asOwner() })
    expect(session?.user.role).toBe("admin")
  })

  test("the owner can create a second account, which can sign in", async () => {
    await auth.api.createUser({ body: second, headers: asOwner() })

    const res = await h.app.inject({
      method: "POST",
      url: "/api/auth/sign-in/username",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        username: second.data.username,
        password: second.password,
      }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers["set-cookie"]).toBeDefined()
  })

  // The sign-up blocker sits on /api/auth/sign-up*; the admin route must not be
  // caught by it, since the account UI calls it over HTTP.
  test("the create-user route is reachable over HTTP", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/auth/admin/create-user",
      headers: { "content-type": "application/json", cookie: h.cookie },
      payload: JSON.stringify({
        name: "third",
        email: "third@deck.invalid",
        password: "third-password",
        data: { username: "third", displayUsername: "third" },
      }),
    })
    expect(res.statusCode).toBe(200)
  })

  test("a non-admin cannot create accounts", async () => {
    const signIn = await auth.api.signInUsername({
      body: { username: second.data.username, password: second.password },
      asResponse: true,
    })
    const cookie = signIn.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ")

    await expect(
      auth.api.createUser({
        body: {
          name: "fourth",
          email: "fourth@deck.invalid",
          password: "fourth-password",
        },
        headers: new Headers({ cookie }),
      })
    ).rejects.toThrow()
  })
})
