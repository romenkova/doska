import { MenuContent, MenuItem, MenuSeparator } from "@doska/ui-kit"
import { History, Pencil } from "lucide-react"
import { fallbackCard, useCard, useUpdateCard } from "@doska/core"
import { CopyIdItem } from "./copy-id-item"
import { DeadlineSub } from "./deadline-sub"
import { DeleteItem } from "./delete-item"
import { MoveToBoardSub } from "./move-to-board-sub"
import { MoveToColumnSub } from "./move-to-column-sub"
import { PrioritySub } from "./priority-sub"
import { TagsSub } from "./tags-sub"
import { UsersSub } from "./users-sub"

interface IProps {
  cardId: string
  onEdit: () => void
  onShowHistory: () => void
  closeMenu: () => void
  align?: "start" | "center" | "end"
}

/** Everything the viewer can do to a card without opening it. */
export function CardMenuItems({
  cardId,
  onEdit,
  onShowHistory,
  closeMenu,
  align = "end",
}: IProps) {
  const { data: card = fallbackCard } = useCard(cardId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  return (
    <MenuContent align={align} onClick={(e) => e.stopPropagation()}>
      <MenuItem onClick={onEdit}>
        <Pencil />
        Edit
      </MenuItem>
      <MenuSeparator />
      <MoveToColumnSub cardId={cardId} />
      <MoveToBoardSub cardId={cardId} />
      <MenuSeparator />
      <PrioritySub card={card} onPatch={updateCard} />
      <TagsSub card={card} onPatch={updateCard} />
      <UsersSub card={card} onPatch={updateCard} />
      <DeadlineSub card={card} onPatch={updateCard} closeMenu={closeMenu} />
      <CopyIdItem cardId={cardId} />
      <MenuItem onClick={onShowHistory}>
        <History />
        History
      </MenuItem>
      <MenuSeparator />
      <DeleteItem cardId={cardId} />
    </MenuContent>
  )
}
