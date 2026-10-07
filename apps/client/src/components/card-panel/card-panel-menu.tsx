import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  type MenuActions,
} from "@doska/ui-kit"
import {
  History,
  LocateFixed,
  MoreHorizontal,
  Pencil,
  PictureInPicture2,
  Trash2,
} from "lucide-react"
import { useRef, useState } from "react"
import { CopyIdItem } from "../card/menu/copy-id-item"
import { DeadlineSub } from "../card/menu/deadline-sub"
import { MoveToColumnSub } from "../card/menu/move-to-column-sub"
import { PrioritySub } from "../card/menu/priority-sub"
import { TagsSub } from "../card/menu/tags-sub"
import { UsersSub } from "../card/menu/users-sub"
import { HistoryModal } from "../history/history-modal"

interface IProps {
  cardId: string
  isPreview: boolean
  onEdit: () => void
  onReveal: () => void
  onDelete: () => void
  /** Desktop only, and never inside a popout: it is already its own window. */
  onPopOut?: () => void
}

/**
 * The open card's actions: the same set the board card's menu offers, plus
 * "Reveal on board". Delete goes through the panel's own handler rather than
 * `DeleteItem`, since the panel has to close itself and offer the undo toast.
 */
export function CardPanelMenu({
  cardId,
  isPreview,
  onEdit,
  onReveal,
  onDelete,
  onPopOut,
}: IProps) {
  const actionsRef = useRef<MenuActions>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <>
      <Menu actionsRef={actionsRef}>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Card actions"
              tooltip={false}
            />
          }
        >
          <MoreHorizontal />
        </MenuTrigger>
        <MenuContent align="end">
          {isPreview && (
            <MenuItem onClick={onEdit}>
              <Pencil />
              Edit
            </MenuItem>
          )}
          <MenuItem onClick={onReveal}>
            <LocateFixed />
            Reveal on board
          </MenuItem>
          {onPopOut && (
            <MenuItem onClick={onPopOut}>
              <PictureInPicture2 />
              Open in new window
            </MenuItem>
          )}
          <MenuSeparator />
          <MoveToColumnSub cardId={cardId} />
          <MenuSeparator />
          <PrioritySub cardId={cardId} />
          <TagsSub cardId={cardId} />
          <UsersSub cardId={cardId} />
          <DeadlineSub
            cardId={cardId}
            closeMenu={() => actionsRef.current?.close()}
          />
          <CopyIdItem cardId={cardId} />
          <MenuItem onClick={() => setHistoryOpen(true)}>
            <History />
            History
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={onDelete} variant="destructive">
            <Trash2 />
            Delete
          </MenuItem>
        </MenuContent>
      </Menu>
      <HistoryModal
        entityType="card"
        entityId={cardId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  )
}
