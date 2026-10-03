import { useCallback, useState } from "react"
import { motion } from "motion/react"
import {
  type DigestCard,
  useMoveCardToColumn,
  useSaveCard,
  type CardPatch,
} from "@doska/core"
import { useDashboardNav } from "@/lib/hooks"
import { REORDER_TRANSITION } from "@/lib/motion"
import { DigestRow } from "./digest-row"
import { DoneColumnHelp } from "./done-column-help"

interface IProps {
  entry: DigestCard
  isActive: boolean
  showBoard?: boolean
  onOpen: () => void
}

/** Ticking a row moves the card, so the list item owns that write — and the
 * explanation shown when the board has nowhere to move it to. */
export function DigestRowView({ entry, isActive, showBoard, onOpen }: IProps) {
  const { card, boardId, isDone, doneColumnId, undoneColumnId } = entry
  const { selectDashboard } = useDashboardNav()
  const { mutate: moveCardToColumn } = useMoveCardToColumn()
  const { mutate: saveCard } = useSaveCard()
  const [helpOpen, setHelpOpen] = useState(false)

  const patchCard = useCallback(
    (cardId: string, patch: CardPatch) => saveCard({ id: cardId, patch }),
    [saveCard]
  )

  // Null when the board has no done column, and then there is nowhere to send it.
  const target = isDone ? undoneColumnId : doneColumnId

  return (
    <motion.li
      layoutId={card.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={REORDER_TRANSITION}
    >
      <DigestRow
        entry={entry}
        isActive={isActive}
        showBoard={showBoard}
        canToggleDone={target !== null}
        onOpen={onOpen}
        onToggleDone={() => {
          if (target) moveCardToColumn({ id: card.id, columnId: target })
          else setHelpOpen(true)
        }}
        onOpenBoard={() => selectDashboard(boardId)}
        onPatch={patchCard}
      />
      {!target && (
        <DoneColumnHelp
          open={helpOpen}
          onOpenChange={setHelpOpen}
          boardId={boardId}
          onOpenBoard={() => selectDashboard(boardId)}
        />
      )}
    </motion.li>
  )
}
