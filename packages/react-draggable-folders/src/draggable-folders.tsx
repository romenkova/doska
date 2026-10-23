import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  useRef,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react"
import { flushSync } from "react-dom"
import { flattenTree } from "./flatten-tree"
import { RowMotion } from "./row-motion"
import type { DepthLimits, TreeFolder, TreeItem, TreeRow } from "./types"
import type { FolderTree } from "./use-folder-tree"
import { useTreeDrag } from "./use-tree-drag"

export interface RowState {
  /** This row is the one being dragged. */
  dragging: boolean
}

export interface FolderRowState extends RowState {
  collapsed: boolean
  /** The dragged row would land in this folder. */
  isDropTarget: boolean
}

export interface DraggableFoldersProps<I, F> {
  tree: FolderTree<I, F>
  renderItem: (item: TreeItem<I>, state: RowState) => ReactNode
  renderFolder: (folder: TreeFolder<I, F>, state: FolderRowState) => ReactNode
  /** Shown in an expanded folder that holds nothing. */
  renderEmpty?: (folder: TreeFolder<I, F>) => ReactNode
  isDragDisabled?: (id: string) => boolean
  limits?: DepthLimits
  indentPx?: number
  dropAnimationMs?: number
  droppableId?: string
  components?: {
    List?: ComponentType<ComponentProps<"ul">>
    Row?: ComponentType<ComponentProps<"li">>
  }
  className?: string
}

const NO_LIMITS: DepthLimits = { item: Infinity, folder: Infinity }

export function DraggableFolders<I, F>({
  tree,
  renderItem,
  renderFolder,
  renderEmpty,
  isDragDisabled,
  limits = NO_LIMITS,
  indentPx = 16,
  dropAnimationMs = 150,
  droppableId = "react-draggable-folders",
  components,
  className,
}: DraggableFoldersProps<I, F>) {
  const List = components?.List ?? "ul"
  const Row = components?.Row ?? "li"
  const folderElements = useRef(new Map<string, HTMLElement>())
  const rowElements = useRef(new Map<string, HTMLElement>())
  const rows = flattenTree(tree.nodes, tree.collapsedIds)
  const {
    dragging,
    draggingFolderId,
    landingFolderId,
    landingDepth,
    vanishOnDrop,
    responders,
    onPointerDown,
  } = useTreeDrag(rows, {
    limits,
    indentPx,
    // Synchronous, or dnd paints the old order for a frame
    onMove: (move) => flushSync(() => tree.move(move)),
    folderElements,
    rowElements,
  })

  // The dragged row follows the depth it would land at.
  const indent = (row: TreeRow<I, F>, isDragging: boolean): CSSProperties => ({
    marginLeft: (isDragging ? landingDepth : row.path.length) * indentPx,
    transition: isDragging ? "margin-left 150ms" : undefined,
  })

  const content = (row: TreeRow<I, F>, isDragging: boolean) => {
    if (row.type === "empty") {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateRows: row.hidden ? "0fr" : "1fr",
            transition: "grid-template-rows 150ms",
            marginLeft: row.path.length * indentPx,
          }}
        >
          <div style={{ overflow: "hidden" }}>{renderEmpty?.(row.folder)}</div>
        </div>
      )
    }
    if (row.type === "item") {
      return (
        <div style={indent(row, isDragging)}>
          {renderItem(row.item, { dragging: isDragging })}
        </div>
      )
    }
    const { id } = row
    return (
      <div
        style={indent(row, isDragging)}
        ref={(element) => {
          if (element) folderElements.current.set(id, element)
          else folderElements.current.delete(id)
        }}
      >
        {renderFolder(row.folder, {
          dragging: isDragging,
          collapsed: row.collapsed,
          isDropTarget: id === landingFolderId,
        })}
      </div>
    )
  }

  return (
    <DragDropContext {...responders}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <List
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={className}
            onPointerDown={onPointerDown}
          >
            {rows.map((row, index) => (
              <Draggable
                key={row.id}
                draggableId={row.id}
                index={index}
                disableInteractiveElementBlocking
                isDragDisabled={
                  row.type === "empty" || (isDragDisabled?.(row.id) ?? false)
                }
              >
                {(dragProvided, snapshot) => {
                  // Not `0s`: that never fires `transitionend`
                  const dropMs = vanishOnDrop ? 1 : dropAnimationMs
                  const hidden =
                    draggingFolderId !== null &&
                    row.path.includes(draggingFolderId)
                  return (
                    <Row
                      ref={(element) => {
                        dragProvided.innerRef(element)
                        if (element) rowElements.current.set(row.id, element)
                        else rowElements.current.delete(row.id)
                      }}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      role="listitem"
                      style={{
                        ...dragProvided.draggableProps.style,
                        ...(snapshot.isDropAnimating && {
                          transitionDuration: `${dropMs}ms`,
                        }),
                        ...(vanishOnDrop &&
                          snapshot.isDropAnimating && { opacity: 0 }),
                        ...(hidden && { height: 0, overflow: "hidden" }),
                      }}
                    >
                      <RowMotion dragging={dragging}>
                        {content(row, snapshot.isDragging)}
                      </RowMotion>
                    </Row>
                  )
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  )
}
