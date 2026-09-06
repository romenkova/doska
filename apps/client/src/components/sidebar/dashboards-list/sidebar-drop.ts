import type { DragUpdate } from "@hello-pangea/dnd"
import type {
  SidebarFolderNode,
  SidebarNode,
  SidebarTarget,
} from "@doska/core/operations"
import type { Dashboard } from "@doska/core/types"

// `folderId` is the block a row is part of. A folder header is part of its own
// block; a root board has none.
export type SidebarRow = { id: string; folderId: string | null } & (
  | { type: "folder"; node: SidebarFolderNode }
  | { type: "board"; dashboard: Dashboard }
  // "No boards yet". Every expanded folder has one, hidden once it has boards.
  | { type: "empty"; hidden: boolean }
)

export interface SidebarMove {
  id: string
  target: SidebarTarget
}

export function flattenTree(nodes: SidebarNode[]): SidebarRow[] {
  const rows: SidebarRow[] = []
  for (const node of nodes) {
    if (node.type === "board") {
      const { dashboard } = node
      rows.push({ type: "board", id: dashboard.id, dashboard, folderId: null })
      continue
    }
    rows.push({ type: "folder", id: node.id, node, folderId: node.id })
    if (node.collapsed) continue
    for (const dashboard of node.boards) {
      rows.push({
        type: "board",
        id: dashboard.id,
        dashboard,
        folderId: node.id,
      })
    }
    rows.push({
      type: "empty",
      id: `${node.id}:empty`,
      folderId: node.id,
      hidden: node.boards.length > 0,
    })
  }
  return rows
}

// `nested`: the dragged board sits at the indent. At the end of a folder block
// that is the only thing separating its last slot from the root slot after it.
export function sidebarDropTarget(
  rows: SidebarRow[],
  result: DragUpdate,
  nested: boolean
): SidebarMove | null {
  const dragged = rows.find((row) => row.id === result.draggableId)
  if (!dragged || !result.destination) return null
  const rest = rows.filter((row) => row.id !== dragged.id)
  const move = placeBelow(dragged, rest, result.destination.index - 1, nested)
  const home = placeBelow(
    dragged,
    rest,
    result.source.index - 1,
    dragged.type === "board" && dragged.folderId !== null
  )
  return sameTarget(move.target, home.target) ? null : move
}

function sameTarget(a: SidebarTarget, b: SidebarTarget) {
  return (
    a.kind === b.kind &&
    a.index === b.index &&
    (a.kind === "root" || b.kind === "root" || a.folderId === b.folderId)
  )
}

// Lands right under `rest[aboveIndex]`; -1 is the top.
function placeBelow(
  dragged: SidebarRow,
  rest: SidebarRow[],
  aboveIndex: number,
  nested: boolean
): SidebarMove {
  const above = rest[aboveIndex]
  const before = rest.slice(0, aboveIndex + 1)
  const root = (): SidebarMove => {
    const index = before.filter(
      (row) => row.type === "folder" || row.folderId === null
    ).length
    return { id: dragged.id, target: { kind: "root", index } }
  }

  if (dragged.type !== "board" || !above?.folderId) return root()
  if (endsBlock(rest, aboveIndex) && !nested) return root()
  return {
    id: dragged.id,
    target: {
      kind: "folder",
      folderId: above.folderId,
      index: folderIndex(before, above),
    },
  }
}

// Whether nothing visible of `rest[index]`'s block comes after it.
function endsBlock(rest: SidebarRow[], index: number) {
  const next = rest[index + 1]
  if (!next || next.folderId !== rest[index].folderId) return true
  return next.type === "empty" && next.hidden
}

// A collapsed folder's boards are not rows, so it takes the board last.
function folderIndex(before: SidebarRow[], above: SidebarRow) {
  if (above.type === "folder" && above.node.collapsed) {
    return above.node.boards.length
  }
  return before.filter(
    (row) => row.type === "board" && row.folderId === above.folderId
  ).length
}
