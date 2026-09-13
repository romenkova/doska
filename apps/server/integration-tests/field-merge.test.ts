import {
  CARD_GROUPS,
  COLUMN_GROUPS,
  type Card,
  type CardGroup,
  type Column,
  type ColumnGroup,
} from "@doska/contract"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

/** Every device starts from this record, created at t=1. */
const created = 1

const stampAll = <G extends string>(
  groups: readonly G[],
  at: number
): Record<G, number> =>
  Object.fromEntries(groups.map((g) => [g, at])) as Record<G, number>

function card(patch: Partial<Card> = {}): Card {
  return {
    id: "card1",
    title: "Card",
    body: "",
    position: "a",
    columnId: "c1",
    number: null,
    deadline: null,
    priority: "",
    attachments: [],
    updatedAt: created,
    deletedAt: null,
    stamps: stampAll(CARD_GROUPS, created),
    bodyConflict: null,
    ...patch,
  }
}

function column(patch: Partial<Column> = {}): Column {
  return {
    id: "c1",
    title: "Todo",
    position: "a",
    dashboardId: "b1",
    collapsed: false,
    color: "",
    done: false,
    updatedAt: created,
    deletedAt: null,
    stamps: stampAll(COLUMN_GROUPS, created),
    ...patch,
  }
}

/** What a stamping client sends after editing `groups` at `at`. */
function touchCard(c: Card, groups: CardGroup[], at: number): Card {
  return {
    ...c,
    updatedAt: Math.max(c.updatedAt, at),
    stamps: { ...c.stamps, ...stampAll(groups, at) },
  }
}

function touchColumn(c: Column, groups: ColumnGroup[], at: number): Column {
  return {
    ...c,
    updatedAt: Math.max(c.updatedAt, at),
    stamps: { ...c.stamps, ...stampAll(groups, at) },
  }
}

const pushCard = (record: Card, baseBody?: string) =>
  client.board.sync({
    boardId: "b1",
    since: 0,
    changes: [{ store: "cards", record, baseBody }],
  })

const pushColumn = (record: Column) =>
  client.board.sync({
    boardId: "b1",
    since: 0,
    changes: [{ store: "columns", record }],
  })

async function readCard(): Promise<Card> {
  const res = await client.board.sync({ boardId: "b1", since: 0, changes: [] })
  const hit = res.changes.find((c) => c.store === "cards")
  if (!hit || hit.store !== "cards") throw new Error("card1 not on the board")
  return hit.record
}

describe("per-field merge", () => {
  test("a body edit and a deadline edit from different devices both land", async () => {
    await pushCard(card())
    const a = touchCard(card({ body: "from A" }), ["body"], 10)
    const b = touchCard(card({ deadline: "2026-10-01" }), ["deadline"], 11)

    await pushCard(a)
    await pushCard(b)

    const stored = await readCard()
    expect(stored.body).toBe("from A")
    expect(stored.deadline).toBe("2026-10-01")
    expect(stored.stamps).toMatchObject({ body: 10, deadline: 11, title: 1 })
    expect(stored.updatedAt).toBe(11)
  })

  test("same group from both sides: newer wins, the older push consumes no seq", async () => {
    await pushCard(card())
    const newer = await pushCard(
      touchCard(card({ title: "newer" }), ["title"], 20)
    )
    const older = await pushCard(
      touchCard(card({ title: "older" }), ["title"], 15)
    )

    expect(older.cursor).toBe(newer.cursor)
    expect((await readCard()).title).toBe("newer")
  })

  test("a push without stamps reads every group at its updatedAt", async () => {
    await pushCard(card())
    await pushCard(touchCard(card({ body: "from A" }), ["body"], 10))
    await pushCard(
      touchCard(card({ deadline: "2026-10-01" }), ["deadline"], 11)
    )

    // An old client never saw either edit and pushes its whole copy.
    const legacy: Partial<Card> = card({ title: "old" })
    delete legacy.stamps
    delete legacy.bodyConflict

    // Between the groups: beats the title stamped at 1, loses to body and deadline.
    await pushCard({ ...legacy, updatedAt: 5 } as Card)
    const between = await readCard()
    expect(between.title).toBe("old")
    expect(between.body).toBe("from A")
    expect(between.deadline).toBe("2026-10-01")
    expect(between.stamps).toMatchObject({ title: 5, body: 10, deadline: 11 })

    // Past everything: takes every field, merged body included.
    await pushCard({ ...legacy, updatedAt: 12 } as Card)
    const after = await readCard()
    expect(after.title).toBe("old")
    expect(after.body).toBe("")
    expect(after.deadline).toBeNull()
    expect(after.stamps).toEqual(stampAll(CARD_GROUPS, 12))
  })

  test("a delete from B keeps a later body edit from A on the tombstone", async () => {
    await pushCard(card())
    await pushCard(touchCard(card({ deletedAt: 10 }), ["deleted"], 10))
    await pushCard(touchCard(card({ body: "from A" }), ["body"], 11))

    const stored = await readCard()
    expect(stored.deletedAt).toBe(10)
    expect(stored.body).toBe("from A")
  })

  test("two pushes to one card at the same time lose neither group", async () => {
    await pushCard(card())
    await Promise.all([
      pushCard(touchCard(card({ title: "from A" }), ["title"], 10)),
      pushCard(touchCard(card({ deadline: "2026-10-01" }), ["deadline"], 11)),
    ])

    const stored = await readCard()
    expect(stored.title).toBe("from A")
    expect(stored.deadline).toBe("2026-10-01")
  })

  test("columns merge per group too", async () => {
    await pushColumn(column())
    await pushColumn(touchColumn(column({ title: "Doing" }), ["title"], 10))
    await pushColumn(
      touchColumn(column({ collapsed: true }), ["collapsed"], 11)
    )

    const res = await client.board.sync({
      boardId: "b1",
      since: 0,
      changes: [],
    })
    const stored = res.changes[0]
    expect(stored.store).toBe("columns")
    expect(stored.record).toMatchObject({
      title: "Doing",
      collapsed: true,
      updatedAt: 11,
      stamps: { title: 10, collapsed: 11, color: 1 },
    })
  })
})

describe("body 3-way merge", () => {
  const base = "intro\n\n- [ ] one\n- [ ] two\n\noutro\n"

  test("edits in different paragraphs both survive, and the body stamp moves past the push", async () => {
    await pushCard(card({ body: base }))
    const a = touchCard(
      card({ body: base.replace("intro", "INTRO") }),
      ["body"],
      10
    )
    const b = touchCard(
      card({ body: base.replace("- [ ] two", "- [x] two") }),
      ["body"],
      11
    )

    await pushCard(a, base)
    await pushCard(b, base)

    const stored = await readCard()
    expect(stored.body).toBe("INTRO\n\n- [ ] one\n- [x] two\n\noutro\n")
    expect(stored.bodyConflict).toBeNull()
    expect(stored.stamps.body).toBe(12)
    expect(stored.updatedAt).toBe(12)
  })

  test("the same line edited on both sides: newer wins, the loser is kept as the conflict", async () => {
    await pushCard(card({ body: base }))
    const a = touchCard(
      card({ body: base.replace("intro", "A's intro") }),
      ["body"],
      10
    )
    const b = touchCard(
      card({ body: base.replace("intro", "B's intro") }),
      ["body"],
      11
    )

    await pushCard(a, base)
    await pushCard(b, base)

    const stored = await readCard()
    expect(stored.body).toBe(b.body)
    expect(stored.bodyConflict).toEqual({ body: a.body, at: 11 })
    expect(stored.stamps.body).toBe(11)
    expect(stored.stamps.conflict).toBe(12)
  })

  test("the older edit arriving second still loses, and the row is rewritten to carry the conflict", async () => {
    await pushCard(card({ body: base }))
    const a = touchCard(
      card({ body: base.replace("intro", "A's intro") }),
      ["body"],
      10
    )
    const b = touchCard(
      card({ body: base.replace("intro", "B's intro") }),
      ["body"],
      11
    )

    const first = await pushCard(b, base)
    const second = await pushCard(a, base)
    expect(second.cursor).toBeGreaterThan(first.cursor)

    const stored = await readCard()
    expect(stored.body).toBe(b.body)
    expect(stored.bodyConflict).toEqual({ body: a.body, at: 11 })
    // Past A's own stamp, or A's copy ties on pull and never takes B's text.
    expect(stored.stamps.body).toBe(12)
  })

  test("a baseBody equal to the stored body is plain LWW with no bump", async () => {
    await pushCard(card({ body: base }))
    await pushCard(touchCard(card({ body: "rewritten" }), ["body"], 10), base)

    const stored = await readCard()
    expect(stored.body).toBe("rewritten")
    expect(stored.stamps.body).toBe(10)
    expect(stored.bodyConflict).toBeNull()
  })
})
