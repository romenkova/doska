import { useSetColumnDone } from "@doska/core/mutations"
import { useBoard } from "@doska/core/queries"
import { byPosition } from "@doska/core/utils"
import { Pressable, Text, View } from "react-native"
import { ColumnSwatch } from "@/components/column/column-swatch"

interface IProps {
  boardId: string
  onPicked: () => void
}

/** Sets the board's done column without leaving Upcoming. */
export function DoneColumnPicker({ boardId, onPicked }: IProps) {
  const { data: board } = useBoard(boardId)
  const { mutate: setColumnDone } = useSetColumnDone(boardId)

  const columns = [...(board?.columns ?? [])].sort(byPosition)
  if (columns.length === 0) return null

  return (
    <View>
      <Text className="px-3 pb-1 text-[13px] font-sans-medium text-muted-foreground">
        Which column means done here?
      </Text>
      {columns.map((column) => (
        <Pressable
          key={column.id}
          onPress={() => {
            setColumnDone({ id: column.id, done: true })
            onPicked()
          }}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
        >
          <ColumnSwatch color={column.color} />
          <Text className="flex-1 text-[17px] font-sans text-card-foreground">
            {column.title || "Untitled column"}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
