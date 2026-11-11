import { SidebarMenuButton, cn } from "@doska/ui-kit"
import { Globe, Users } from "lucide-react"
import { useMemo, useState } from "react"
import {
  type Dashboard,
  useDeleteDashboard,
  useDuplicateDashboard,
} from "@doska/core"
import { useCardDrop } from "@/providers/card-drop/card-drop-context"
import { useDashboardNav } from "@/lib/hooks"
import { unlinkDeletedBoard } from "@/lib/vault/use-vault"
import { ConfirmDialog } from "../../../confirm-dialog"
import { BoardContextMenu } from "./board-context-menu"
import { BoardMenu } from "./board-menu"

interface IProps {
  dashboard: Dashboard
  isActive: boolean
  isPublished: boolean
  isShared: boolean
}

export function BoardItem({
  dashboard,
  isActive,
  isPublished,
  isShared,
}: IProps) {
  const { selectDashboard } = useDashboardNav()
  const { mutate: duplicate } = useDuplicateDashboard()
  const { mutate: deleteDashboard } = useDeleteDashboard()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { target } = useCardDrop()
  const isCardTarget = target?.kind === "board" && target.id === dashboard.id
  const marker = useMemo(() => {
    if (isPublished) return { Icon: Globe, label: "Public" }
    if (isShared) return { Icon: Users, label: "Shared" }
    return null
  }, [isPublished, isShared])

  const actions = {
    onDuplicate: () =>
      duplicate(dashboard, {
        onSuccess: (created) => selectDashboard(created.id),
      }),
    onDelete: () => setConfirmOpen(true),
  }

  return (
    <>
      <BoardContextMenu {...actions}>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={dashboard.title}
          onClick={() => selectDashboard(dashboard.id)}
          data-drop-board={isActive ? undefined : dashboard.id}
          className={cn(
            "pr-8",
            isCardTarget &&
              "bg-sidebar-accent ring-2 ring-primary/60 ring-inset"
          )}
        >
          <span className="truncate">{dashboard.title}</span>
          {marker && (
            <marker.Icon
              role="img"
              aria-label={marker.label}
              className="ml-auto size-3.5 text-muted-foreground"
            />
          )}
        </SidebarMenuButton>
      </BoardContextMenu>
      <BoardMenu {...actions} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete board?"
        description={`"${dashboard.title}" and all of its columns and cards move to the trash, where they stay restorable for 14 days.`}
        confirmLabel="Delete board"
        onConfirm={() => {
          unlinkDeletedBoard(dashboard.id)
          deleteDashboard(dashboard.id)
        }}
      />
    </>
  )
}
