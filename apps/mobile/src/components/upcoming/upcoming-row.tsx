import { useMoveCardToColumn } from "@doska/core/mutations"
import type { DigestCard } from "@doska/core/operations"
import { router } from "expo-router"
import { Pressable, Text, View } from "react-native"
import { ColumnSwatch } from "@/components/column/column-swatch"
import { DoneCheckbox } from "@/components/upcoming/done-checkbox"
import { ROUTES } from "@/lib/routes"

interface IProps {
  entry: DigestCard
}

export function UpcomingRow({ entry }: IProps) {
  const { mutate: moveCardToColumn } = useMoveCardToColumn()
  const target = entry.isDone ? entry.undoneColumnId : entry.doneColumnId

  return (
    <Pressable
      onPress={() => router.push(ROUTES.card(entry.card.id))}
      className={
        entry.isDone
          ? "flex-row gap-3 rounded-xl border border-border bg-card p-3 opacity-40 active:opacity-30"
          : "flex-row gap-3 rounded-xl border border-border bg-card p-3 active:opacity-70"
      }
    >
      <View className="pt-0.5">
        <DoneCheckbox
          checked={entry.isDone}
          stuck={!target}
          onPress={() => {
            if (!target) {
              router.push(ROUTES.boardDoneColumn(entry.boardId))
              return
            }
            moveCardToColumn({ id: entry.card.id, columnId: target })
          }}
        />
      </View>
      <View className="flex-1 gap-1">
        <Text
          className={
            entry.isDone
              ? "text-[15px] font-sans-medium text-muted-foreground line-through"
              : "text-[15px] font-sans-medium text-card-foreground"
          }
        >
          {entry.card.title || "Untitled card"}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <ColumnSwatch color={entry.column.color} />
          <Text
            numberOfLines={1}
            className="shrink text-xs text-muted-foreground"
          >
            {entry.boardTitle || "Untitled board"} · {entry.columnTitle}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}
