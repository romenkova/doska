import { describe, expect, it } from "vitest"
import {
  mergeRecord,
  type FieldGroups,
  type Stamped,
} from "../src/merge-record"

type Group = "title" | "body" | "deadline" | "place" | "deleted"

type Card = Stamped<Group> & {
  id: string
  title: string
  body: string
  deadline: string | null
  columnId: string
  position: number
  deletedAt: number | null
}

const groups: FieldGroups<Card, Group> = {
  title: "title",
  body: "body",
  deadline: "deadline",
  columnId: "place",
  position: "place",
  deletedAt: "deleted",
}

const card: Card = {
  id: "c1",
  title: "t",
  body: "b",
  deadline: null,
  columnId: "col1",
  position: 1,
  deletedAt: null,
  updatedAt: 10,
}

const allAt = (at: number): Record<Group, number> => ({
  title: at,
  body: at,
  deadline: at,
  place: at,
  deleted: at,
})

describe("mergeRecord", () => {
  it("no stored record takes incoming with a full stamp map", () => {
    const { record, changed } = mergeRecord(undefined, card, groups)
    expect(changed).toBe(true)
    expect(record).toEqual({ ...card, stamps: allAt(10) })
  })

  it("newer body from A and newer deadline from B are both kept", () => {
    const fromA = {
      ...card,
      body: "from A",
      updatedAt: 12,
      stamps: { ...allAt(10), body: 12 },
    }
    const fromB = {
      ...card,
      deadline: "2026-10-01",
      updatedAt: 11,
      stamps: { ...allAt(10), deadline: 11 },
    }
    const { record, changed } = mergeRecord(fromA, fromB, groups)
    expect(changed).toBe(true)
    expect(record.body).toBe("from A")
    expect(record.deadline).toBe("2026-10-01")
    expect(record.stamps).toEqual({ ...allAt(10), body: 12, deadline: 11 })
  })

  it("same group both sides: newer wins, tie keeps stored", () => {
    const stored = {
      ...card,
      title: "stored",
      updatedAt: 12,
      stamps: { ...allAt(10), title: 12 },
    }
    const older = {
      ...card,
      title: "older",
      updatedAt: 11,
      stamps: { ...allAt(10), title: 11 },
    }
    const tie = {
      ...card,
      title: "tie",
      updatedAt: 12,
      stamps: { ...allAt(10), title: 12 },
    }
    const newer = {
      ...card,
      title: "newer",
      updatedAt: 13,
      stamps: { ...allAt(10), title: 13 },
    }

    expect(mergeRecord(stored, older, groups)).toEqual({
      record: stored,
      changed: false,
    })
    expect(mergeRecord(stored, tie, groups)).toEqual({
      record: stored,
      changed: false,
    })
    expect(mergeRecord(stored, newer, groups).record.title).toBe("newer")
  })

  it("records without stamps behave as whole-record LWW", () => {
    const stored = { ...card, title: "old", body: "old" }
    const newer = { ...card, title: "new", body: "new", updatedAt: 11 }
    const older = { ...card, title: "older", body: "older", updatedAt: 9 }

    const taken = mergeRecord(stored, newer, groups)
    expect(taken.changed).toBe(true)
    expect(taken.record).toEqual({ ...newer, stamps: allAt(11) })

    const kept = mergeRecord(stored, older, groups)
    expect(kept.changed).toBe(false)
    expect(kept.record).toEqual({ ...stored, stamps: allAt(10) })
  })

  it("stored row with empty stamps takes one newer group and the rest keep the old updatedAt", () => {
    const stored = { ...card, stamps: {} }
    const bodyEdit = {
      ...card,
      body: "edited",
      updatedAt: 12,
      stamps: { ...allAt(10), body: 12 },
    }
    const { record } = mergeRecord(stored, bodyEdit, groups)
    expect(record.stamps).toEqual({ ...allAt(10), body: 12 })
    expect(record.updatedAt).toBe(12)

    // A concurrent title edit stamped 11 still beats the untouched title (10), not the new updatedAt (12).
    const titleEdit = {
      ...card,
      title: "concurrent",
      updatedAt: 11,
      stamps: { ...allAt(10), title: 11 },
    }
    const after = mergeRecord(record, titleEdit, groups)
    expect(after.changed).toBe(true)
    expect(after.record.title).toBe("concurrent")
    expect(after.record.body).toBe("edited")
  })

  it("updatedAt on the result is the max stamp", () => {
    const stored = { ...card, stamps: allAt(10) }
    const incoming = {
      ...card,
      deadline: "2026-10-01",
      updatedAt: 15,
      stamps: { ...allAt(10), deadline: 15 },
    }
    expect(mergeRecord(stored, incoming, groups).record.updatedAt).toBe(15)
  })

  it("deleted group is independent: a later body edit does not revive", () => {
    const deleted = {
      ...card,
      deletedAt: 20,
      updatedAt: 20,
      stamps: { ...allAt(10), deleted: 20 },
    }
    const bodyEdit = {
      ...card,
      body: "late edit",
      updatedAt: 21,
      stamps: { ...allAt(10), body: 21 },
    }
    const { record } = mergeRecord(deleted, bodyEdit, groups)
    expect(record.deletedAt).toBe(20)
    expect(record.body).toBe("late edit")
  })

  it("fields outside the group map stay as stored", () => {
    const stored = { ...card, stamps: allAt(10) }
    const incoming = {
      ...card,
      id: "other",
      title: "new",
      updatedAt: 11,
      stamps: { ...allAt(10), title: 11 },
    }
    expect(mergeRecord(stored, incoming, groups).record.id).toBe("c1")
  })
})
