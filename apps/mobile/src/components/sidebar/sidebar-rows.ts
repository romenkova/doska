import type {
  SidebarFolderNode,
  SidebarNode,
  SidebarTarget,
} from "@doska/core/operations"
import type { Dashboard } from "@doska/core/types"

// Every folder block closes with an `end` row, so a board dropped between a
// folder and its end is in that folder, and anywhere else is at the root.
export type SidebarRow =
  | {
      kind: "folder"
      key: string
      folder: SidebarFolderNode
      collapsed: boolean
    }
  | {
      kind: "board"
      key: string
      dashboard: Dashboard
      folderId: string | null
    }
  | {
      kind: "end"
      key: string
      folder: SidebarFolderNode
      collapsed: boolean
    }

export function sidebarRows(
  nodes: SidebarNode[],
  collapsedIds: string[]
): SidebarRow[] {
  return nodes.flatMap((node): SidebarRow[] => {
    if (node.type === "board") {
      const { dashboard } = node
      return [{ kind: "board", key: dashboard.id, dashboard, folderId: null }]
    }
    const collapsed = collapsedIds.includes(node.id)
    const boards = collapsed ? [] : node.boards
    return [
      { kind: "folder", key: node.id, folder: node, collapsed },
      ...boards.map((dashboard): SidebarRow => ({
        kind: "board",
        key: dashboard.id,
        dashboard,
        folderId: node.id,
      })),
      { kind: "end", key: `${node.id}:end`, folder: node, collapsed },
    ]
  })
}

/** Where a board dropped at `index` of the reordered `rows` lands. */
export function sidebarTarget(
  rows: SidebarRow[],
  index: number
): SidebarTarget {
  const boardId = rows[index]?.key
  let boardsAbove = 0
  for (let i = index - 1; i >= 0; i--) {
    const row = rows[i]!
    if (row.kind === "end") break
    if (row.kind === "board") boardsAbove++
    if (row.kind === "folder") {
      const { folder } = row
      // A collapsed folder shows no boards, so the board goes in last.
      const count = row.collapsed
        ? folder.boards.filter((board) => board.id !== boardId).length
        : boardsAbove
      return { kind: "folder", folderId: folder.id, index: count }
    }
  }

  return { kind: "root", index: rootAbove(rows, index) }
}

export function folderTarget(rows: SidebarRow[], index: number): SidebarTarget {
  return { kind: "root", index: rootAbove(rows, index) }
}

function rootAbove(rows: SidebarRow[], index: number): number {
  return rows
    .slice(0, index)
    .filter(
      (row) => row.kind === "folder" || (row.kind === "board" && !row.folderId)
    ).length
}
