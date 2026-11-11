import { ContextMenu, ContextMenuTrigger, useIsMobile } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { type BoardActions, BoardMenuItems } from "./board-menu-items"

export function BoardContextMenu({
  children,
  ...actions
}: BoardActions & { children: ReactNode }) {
  const isMobile = useIsMobile()
  // Long-press would fight the drag on touch; the three dots cover mobile.
  if (isMobile) return children

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <BoardMenuItems align="start" {...actions} />
    </ContextMenu>
  )
}
