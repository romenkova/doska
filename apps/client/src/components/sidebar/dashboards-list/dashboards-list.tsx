import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  cn,
} from "@doska/ui-kit"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { useSidebarTree } from "@doska/core/queries"
import { useState } from "react"
import { DROP_ANIMATION_MS } from "@/lib/hooks"
import { OrderAnimator } from "../../card/order-animator"
import { DragStateProvider } from "../../deck/drag-state"
import { BoardItem } from "./board-item"
import { BoardsHeader } from "./boards-header"
import { FolderItem } from "./folder/folder-item"
import { flattenTree } from "./sidebar-drop"
import { useSidebarDrag } from "./use-sidebar-drag"

interface IProps {
  activeDashboardId: string
  sharedIds: string[]
  publishedIds: string[]
}

export function DashboardsList({
  activeDashboardId,
  sharedIds,
  publishedIds,
}: IProps) {
  const { data: nodes = [] } = useSidebarTree()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const rows = flattenTree(nodes)
  const {
    dragging,
    draggingFolderId,
    landingFolderId,
    responders,
    onPointerDown,
  } = useSidebarDrag(rows)
  const shared = new Set(sharedIds)
  const published = new Set(publishedIds)
  const intoFolder = landingFolderId !== null

  const lifted = (dragging: boolean) =>
    dragging ? "rounded-md bg-sidebar shadow-e2" : undefined

  return (
    <SidebarGroup className="mt-4">
      <BoardsHeader onFolderCreated={setRenamingId} />
      <SidebarGroupContent>
        <DragStateProvider value={dragging}>
          <DragDropContext {...responders}>
            <Droppable droppableId="sidebar">
              {(provided) => (
                <SidebarMenu
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="-mt-1 space-y-0"
                  onPointerDown={onPointerDown}
                >
                  {rows.map((row, index) => (
                    <Draggable
                      key={row.id}
                      draggableId={row.id}
                      index={index}
                      disableInteractiveElementBlocking
                      isDragDisabled={
                        row.id === renamingId || row.type === "empty"
                      }
                    >
                      {(dragProvided, snapshot) => (
                        <SidebarMenuItem
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          role="listitem"
                          style={{
                            ...dragProvided.draggableProps.style,
                            ...(snapshot.isDropAnimating && {
                              transitionDuration: `${DROP_ANIMATION_MS}ms`,
                            }),
                          }}
                          className={cn(
                            row.type !== "folder" &&
                              draggingFolderId !== null &&
                              row.folderId === draggingFolderId &&
                              "h-0 overflow-hidden"
                          )}
                        >
                          <OrderAnimator>
                            {row.type === "empty" ? (
                              <div
                                className={cn(
                                  "ml-4 overflow-hidden transition-[height] duration-150",
                                  row.hidden ? "h-0" : "h-9"
                                )}
                              >
                                <div className="mt-1 flex h-8 items-center px-2 text-xs text-muted-foreground/60">
                                  No boards yet
                                </div>
                              </div>
                            ) : row.type === "board" ? (
                              <div
                                className={cn(
                                  "pt-1",
                                  (snapshot.isDragging
                                    ? intoFolder
                                    : row.folderId) && "ml-4",
                                  snapshot.isDragging &&
                                    "transition-[margin] duration-150"
                                )}
                              >
                                <div className={lifted(snapshot.isDragging)}>
                                  <BoardItem
                                    dashboard={row.dashboard}
                                    isActive={row.id === activeDashboardId}
                                    isPublished={published.has(row.id)}
                                    isShared={shared.has(row.id)}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="pt-1">
                                <div className={lifted(snapshot.isDragging)}>
                                  <FolderItem
                                    node={row.node}
                                    renaming={row.id === renamingId}
                                    isDropTarget={row.id === landingFolderId}
                                    onRenameStart={() => setRenamingId(row.id)}
                                    onRenameEnd={() => setRenamingId(null)}
                                  />
                                </div>
                              </div>
                            )}
                          </OrderAnimator>
                        </SidebarMenuItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </SidebarMenu>
              )}
            </Droppable>
          </DragDropContext>
        </DragStateProvider>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
