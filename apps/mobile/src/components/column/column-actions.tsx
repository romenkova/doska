import { useSetColumnColor, useSetColumnDone, useBoard } from "@doska/core"
import { Separator, SheetItem } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import CircleCheck from "lucide-react-native/icons/circle-check"
import Trash2 from "lucide-react-native/icons/trash-2"
import { View } from "react-native"
import { ROUTES } from "@/lib/routes"
import { ColumnColorRow } from "./column-color-row"

interface IProps {
  deckId: string
  columnId: string
}

/** The column actions the web keeps behind its `⋯` menu. Renaming is not here:
 * the head's title is the field, as it is on the web. */
export function ColumnActions({ deckId, columnId }: IProps) {
  const { data: board } = useBoard(deckId)
  const { mutate: setColor } = useSetColumnColor(deckId)
  const { mutate: setDone } = useSetColumnDone(deckId)

  const column = board?.columns.find((one) => one.id === columnId)
  if (!column) return null

  return (
    <View className="gap-1">
      <ColumnColorRow
        color={column.color}
        onChange={(color) => setColor({ id: column.id, color })}
      />
      <SheetItem
        icon={CircleCheck}
        label={column.done ? "Unmark cards as done" : "Mark cards as done"}
        onPress={() => {
          setDone({ id: column.id, done: !column.done })
          router.back()
        }}
      />
      <Separator className="my-1" />
      <SheetItem
        icon={Trash2}
        label="Delete column"
        destructive
        onPress={() => router.push(ROUTES.columnDelete(column.id))}
      />
    </View>
  )
}
