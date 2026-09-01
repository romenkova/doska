import { useState } from "react"
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@doska/ui-kit"
import { ArrowRightLeft, MoreHorizontal, Trash2 } from "lucide-react"
import { ConfirmDialog } from "../../confirm-dialog"
import { ReorderColumnsModal } from "../reorder-columns/reorder-columns-modal"
import { SortSub } from "./sort-sub"
import type { Column } from "@doska/core/types"

interface IProps {
  title: string
  columns: Column[]
  sort: string[]
  onChangeSort: (sort: string[]) => void
  onDelete: () => void
  onReorderColumns: (changed: Column[]) => void
}

export function BoardActionsMenu({
  title,
  columns,
  sort,
  onChangeSort,
  onDelete,
  onReorderColumns,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reorderOpen, setReorderOpen] = useState(false)

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Board actions"
              className="text-muted-foreground"
              tooltip={false}
            />
          }
        >
          <MoreHorizontal />
        </MenuTrigger>
        <MenuContent>
          <SortSub sort={sort} onChangeSort={onChangeSort} />
          <MenuItem
            onClick={() => setReorderOpen(true)}
            disabled={columns.length < 2}
          >
            <ArrowRightLeft />
            Reorder columns
          </MenuItem>
          <MenuSeparator className="my-1 h-px" />
          <MenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-destructive"
          >
            <Trash2 />
            Delete board
          </MenuItem>
        </MenuContent>
      </Menu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete board?"
        description={`"${title}" and all of its columns and cards move to the trash, where they stay restorable for 14 days.`}
        confirmLabel="Delete board"
        onConfirm={onDelete}
      />
      <ReorderColumnsModal
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        columns={columns}
        onReorder={onReorderColumns}
      />
    </>
  )
}
