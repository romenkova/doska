import { Button } from "@doska/ui-kit"
import { useSetColumnDone, useBoard } from "@doska/core"
import { ColumnSwatch } from "../column/column-swatch"

interface IProps {
  boardId: string
  onPicked: () => void
}

/**
 * Sets the board's done column without leaving the digest.
 */
export function DoneColumnPicker({ boardId, onPicked }: IProps) {
  const { data: board } = useBoard(boardId)
  const { mutate: setColumnDone } = useSetColumnDone(boardId)

  const columns = board?.columns ?? []
  if (columns.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Which column means done here?
      </p>
      <div className="flex flex-wrap gap-2">
        {columns.map((column) => (
          <Button
            key={column.id}
            variant="outline"
            onClick={() => {
              setColumnDone({ id: column.id, done: true })
              onPicked()
            }}
          >
            <ColumnSwatch color={column.color} />
            {column.title || "Untitled column"}
          </Button>
        ))}
      </div>
    </div>
  )
}
