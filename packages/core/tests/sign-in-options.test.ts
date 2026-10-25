import { describe, expect, it } from "vitest"
import { fetchSignInOptions } from "../src/api/sso"
import { installRuntime, type Runtime } from "../src/runtime"

function serve(configured: boolean, respond: () => Response) {
  installRuntime({
    http: {
      isConfigured: () => configured,
      url: (path: string) => `http://server${path}`,
      fetch: () => Promise.resolve(respond()),
    },
    auth: { token: () => null },
  } as unknown as Runtime)
}

describe("fetchSignInOptions", () => {
  it("passes through what the server says", async () => {
    const providers = [{ id: "oidc", name: "Company SSO" }]
    serve(true, () => Response.json({ providers, authRequired: true }))

    expect(await fetchSignInOptions()).toEqual({
      providers,
      authRequired: true,
    })
  })

  it("treats a server that doesn't send authRequired as not requiring it", async () => {
    serve(true, () => Response.json({ providers: [] }))

    expect(await fetchSignInOptions()).toEqual({
      providers: [],
      authRequired: false,
    })
  })

  it("doesn't require auth when the server errors", async () => {
    serve(true, () => new Response(null, { status: 500 }))

    expect(await fetchSignInOptions()).toEqual({
      providers: [],
      authRequired: false,
    })
  })

  it("doesn't ask at all without a server", async () => {
    serve(false, () => {
      throw new Error("should not fetch")
    })

    expect(await fetchSignInOptions()).toEqual({
      providers: [],
      authRequired: false,
    })
  })
})
