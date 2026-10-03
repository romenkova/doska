import { useMoveColumn, useBoard } from "@doska/core"
import { ReorderColumns } from "@/components/column/reorder-columns"

interface IProps {
  deckId: string
  onClose: () => void
}

export function ColumnReorder({ deckId, onClose }: IProps) {
  const { data: board } = useBoard(deckId)
  const { mutate: moveColumn } = useMoveColumn(deckId)

  return (
    <ReorderColumns
      columns={board?.columns ?? []}
      onReorder={(changed) => moveColumn(changed)}
      onClose={onClose}
    />
  )
}
