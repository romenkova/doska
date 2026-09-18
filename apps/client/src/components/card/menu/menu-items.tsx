import { MenuContent, MenuItem, MenuSeparator } from "@doska/ui-kit"
import { Pencil } from "lucide-react"
import { CopyIdItem } from "./copy-id-item"
import { DeadlineSub } from "./deadline-sub"
import { DeleteItem } from "./delete-item"
import { MoveToBoardSub } from "./move-to-board-sub"
import { MoveToColumnSub } from "./move-to-column-sub"
import { PrioritySub } from "./priority-sub"

interface IProps {
  cardId: string
  onEdit: () => void
  closeMenu: () => void
  align?: "start" | "center" | "end"
}

/** Everything the viewer can do to a card without opening it. */
export function CardMenuItems({
  cardId,
  onEdit,
  closeMenu,
  align = "end",
}: IProps) {
  return (
    <MenuContent align={align} onClick={(e) => e.stopPropagation()}>
      <MenuItem onClick={onEdit}>
        <Pencil />
        Edit
      </MenuItem>
      <MoveToColumnSub cardId={cardId} />
      <MoveToBoardSub cardId={cardId} />
      <PrioritySub cardId={cardId} />
      <DeadlineSub cardId={cardId} closeMenu={closeMenu} />
      <CopyIdItem cardId={cardId} />
      <MenuSeparator />
      <DeleteItem cardId={cardId} />
    </MenuContent>
  )
}
