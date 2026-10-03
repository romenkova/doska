import { describe, expect, it } from "vitest"
import { cardDisplayId, refNumber } from "@doska/contract"

describe("cardDisplayId", () => {
  it("is the number, and nothing until the server stamps one", () => {
    expect(cardDisplayId(12)).toBe("12")
    expect(cardDisplayId(null)).toBeNull()
    expect(cardDisplayId(undefined)).toBeNull()
  })
})

describe("refNumber", () => {
  it("reads a plain number", () => {
    expect(refNumber("12")).toBe(12)
    expect(refNumber(" 12 ")).toBe(12)
  })

  it("still reads a reference written back when ids carried a prefix", () => {
    expect(refNumber("ROAD-12")).toBe(12)
    expect(refNumber("road-12")).toBe(12)
    // A prefix could carry digits of its own, derived from a name like "UB5".
    expect(refNumber("UB5-12")).toBe(12)
  })

  it("is null for anything that isn't one", () => {
    expect(refNumber("")).toBeNull()
    expect(refNumber("ROAD")).toBeNull()
    expect(refNumber("12a")).toBeNull()
    expect(refNumber("a-b-12")).toBeNull()
  })
})
