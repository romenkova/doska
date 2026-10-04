import { describe, expect, it } from "vitest"
import { nameFor, subtitleFor } from "../src/data/account-labels"
import type { Session } from "../src/api/auth"

const SIGNED_IN: Session = {
  authed: true,
  login: "rita",
  userId: "u1",
  image: null,
  isAdmin: false,
}

const SIGNED_OUT: Session = {
  authed: false,
  login: null,
  userId: null,
  image: null,
  isAdmin: false,
}

describe("nameFor", () => {
  it("holds a placeholder while the first check is in flight", () => {
    expect(nameFor(undefined, true)).toBe("…")
  })

  it("reads as signed out once the check has failed", () => {
    expect(nameFor(undefined, false)).toBe("Not signed in")
  })

  it("names the signed-in account", () => {
    expect(nameFor(SIGNED_IN, false)).toBe("rita")
  })

  it("falls back when the account has no login", () => {
    expect(nameFor({ ...SIGNED_IN, login: null }, false)).toBe("Signed in")
  })

  it("reads as signed out when the server says so", () => {
    expect(nameFor(SIGNED_OUT, false)).toBe("Not signed in")
  })
})

describe("subtitleFor", () => {
  it("names the healthy states", () => {
    expect(subtitleFor({ status: "ok" })).toBe("Syncing")
    expect(subtitleFor({ status: "local" })).toBe("Sign in to sync")
  })

  it("names why sync dropped", () => {
    expect(subtitleFor({ status: "dropped", reason: "server" })).toBe(
      "No server"
    )
    expect(subtitleFor({ status: "dropped", reason: "offline" })).toBe(
      "Offline"
    )
  })
})
