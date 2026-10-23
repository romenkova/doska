import type { DragUpdate } from "@hello-pangea/dnd"
import type {
  DepthLimits,
  DropTarget,
  TreeFolder,
  TreeMove,
  TreeRow,
} from "./types"

// `depth` is how far in the pointer asks for. The rows around the slot bound it:
// no deeper than the row above allows, no shallower than the row below.
export function dropTarget<I, F>(
  rows: TreeRow<I, F>[],
  result: DragUpdate,
  depth: number,
  limits: DepthLimits
): TreeMove | null {
  const dragged = rows.find((row) => row.id === result.draggableId)
  if (!dragged || dragged.type === "empty" || !result.destination) return null
  const { above, below } = around(rows, dragged, result.destination.index)
  const target = placeAt(dragged, above, below, depth, limits)
  if (!target || sameTarget(target, homeTarget(rows, dragged))) return null
  return { id: dragged.id, target }
}

function around<I, F>(
  rows: TreeRow<I, F>[],
  dragged: TreeRow<I, F>,
  slot: number
) {
  // A dragged folder's rows are still in the list, at 0px.
  const shown = (row: TreeRow<I, F>) =>
    !(row.type === "empty" && row.hidden) && !row.path.includes(dragged.id)
  const rest = rows.filter((row) => row.id !== dragged.id)
  return {
    above: rest.slice(0, slot).filter(shown),
    below: rest.slice(slot).find(shown),
  }
}

function placeAt<I, F>(
  dragged: TreeRow<I, F>,
  above: TreeRow<I, F>[],
  below: TreeRow<I, F> | undefined,
  depth: number,
  limits: DepthLimits
): DropTarget | null {
  const last = above.at(-1)
  let maxDepth = 0
  if (last) {
    maxDepth = last.type === "folder" ? last.path.length + 1 : last.path.length
  }
  const minDepth = below ? below.path.length : 0
  let cap = limits.item
  if (dragged.type === "folder") {
    cap = limits.folder - folderHeight(dragged.folder)
  }
  const deepest = Math.min(maxDepth, cap)
  if (minDepth > deepest) return null
  const landed = Math.max(minDepth, Math.min(deepest, depth))

  if (landed === 0) {
    const index = above.filter((row) => row.path.length === 0).length
    return { kind: "root", index }
  }

  const parentIndex = above.findLastIndex(
    (row) => row.type === "folder" && row.path.length === landed - 1
  )
  const parent = above[parentIndex]
  if (parent?.type !== "folder") return null
  // A collapsed folder's insides are not rows, so it takes the row last.
  if (parent.collapsed) {
    const siblings =
      dragged.type === "folder" ? parent.folder.folders : parent.folder.items
    const index = siblings.filter((one) => one.id !== dragged.id).length
    return { kind: "folder", folderId: parent.id, index }
  }
  // Subfolders always come first: no item above one, no folder below an item.
  const siblingsAbove = above
    .slice(parentIndex + 1)
    .filter((row) => row.path.length === landed)
  if (dragged.type === "item" && below?.type === "folder") {
    if (below.path.length === landed) return null
  }
  if (dragged.type === "folder") {
    if (siblingsAbove.some((row) => row.type === "item")) return null
  }
  const index = siblingsAbove.filter((row) => row.type === dragged.type).length
  return { kind: "folder", folderId: parent.id, index }
}

/** How many folder levels sit under this one: 0 when it holds no folders. */
function folderHeight<I, F>(folder: TreeFolder<I, F>): number {
  let height = 0
  for (const sub of folder.folders) {
    height = Math.max(height, folderHeight(sub) + 1)
  }
  return height
}

function homeTarget<I, F>(
  rows: TreeRow<I, F>[],
  dragged: TreeRow<I, F>
): DropTarget {
  const before = rows.slice(0, rows.indexOf(dragged))
  const parentId = dragged.path.at(-1)
  if (!parentId) {
    const index = before.filter((row) => row.path.length === 0).length
    return { kind: "root", index }
  }
  const index = before.filter(
    (row) => row.path.at(-1) === parentId && row.type === dragged.type
  ).length
  return { kind: "folder", folderId: parentId, index }
}

function sameTarget(a: DropTarget, b: DropTarget) {
  if (a.kind === "root" || b.kind === "root") {
    return a.kind === b.kind && a.index === b.index
  }
  return a.folderId === b.folderId && a.index === b.index
}
