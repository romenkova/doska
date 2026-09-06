import { describe, expect, it } from "vitest"
import type { DropResult } from "@hello-pangea/dnd"
import type { SidebarNode } from "@doska/core/operations"
import type { Dashboard } from "@doska/core/types"
import { flattenTree, sidebarDropTarget } from "./sidebar-drop"

const dashboard = (id: string) => ({ id, title: id }) as Dashboard
const board = (id: string): SidebarNode => ({
  type: "board",
  dashboard: dashboard(id),
})
const folder = (
  id: string,
  boards: string[],
  collapsed = false
): SidebarNode => ({
  type: "folder",
  id,
  title: id,
  collapsed,
  boards: boards.map(dashboard),
})

// Rows: a, F, b, c, F:empty (hidden), G (collapsed, holds g1), d.
const rows = flattenTree([
  board("a"),
  folder("F", ["b", "c"]),
  folder("G", ["g1"], true),
  board("d"),
])

// `destination` is the index in the list with the dragged row taken out.
const drop = (id: string, destination: number, nested = false) =>
  sidebarDropTarget(
    rows,
    {
      draggableId: id,
      source: { droppableId: "s", index: rows.findIndex((r) => r.id === id) },
      destination: { droppableId: "s", index: destination },
    } as DropResult,
    nested
  )
const root = (id: string, index: number) => ({
  id,
  target: { kind: "root", index },
})
const inFolder = (id: string, folderId: string, index: number) => ({
  id,
  target: { kind: "folder", folderId, index },
})

it("flattens expanded folders, each with an empty row after its boards", () => {
  expect(rows.map((r) => r.id)).toEqual([
    "a",
    "F",
    "b",
    "c",
    "F:empty",
    "G",
    "d",
  ])
  expect(rows[4]).toMatchObject({ type: "empty", hidden: true })
  const empty = flattenTree([folder("E", [])])
  expect(empty[1]).toMatchObject({ type: "empty", hidden: false })
})

describe("sidebarDropTarget", () => {
  it("is null in place, outside the list, or when a folder would nest", () => {
    expect(drop("a", 0)).toBeNull()
    expect(drop("c", 3, true)).toBeNull()
    expect(
      sidebarDropTarget(rows, { draggableId: "a" } as DropResult, false)
    ).toBeNull()
    // G between b and c snaps out below the F block, where it already is.
    expect(drop("G", 3)).toBeNull()
  })

  it("reorders at the root", () => {
    expect(drop("a", 6)).toEqual(root("a", 3))
    expect(drop("F", 5)).toEqual(root("F", 2))
  })

  it("puts a board under an expanded header or mid-folder into that folder", () => {
    expect(drop("a", 1, false)).toEqual(inFolder("a", "F", 0))
    expect(drop("a", 2, false)).toEqual(inFolder("a", "F", 1))
    expect(drop("b", 1)).toEqual(root("b", 1))
  })

  it("at the end of a block, or under a collapsed header, nesting decides", () => {
    expect(drop("a", 4, true)).toEqual(inFolder("a", "F", 2))
    expect(drop("a", 4, false)).toEqual(root("a", 1))
    expect(drop("c", 3, false)).toEqual(root("c", 2))
    expect(drop("a", 5, true)).toEqual(inFolder("a", "G", 1))
    expect(drop("a", 5, false)).toEqual(root("a", 2))
  })
})
