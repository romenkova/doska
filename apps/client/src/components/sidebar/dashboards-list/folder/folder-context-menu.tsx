import { ContextMenu, ContextMenuTrigger, useIsMobile } from "@doska/ui-kit"
import type { ReactNode } from "react"
import { type FolderActions, FolderMenuItems } from "./folder-menu-items"

export function FolderContextMenu({
  children,
  ...actions
}: FolderActions & { children: ReactNode }) {
  const isMobile = useIsMobile()
  // Long-press would fight the drag on touch; the three dots cover mobile.
  if (isMobile) return children

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <FolderMenuItems align="start" {...actions} />
    </ContextMenu>
  )
}
