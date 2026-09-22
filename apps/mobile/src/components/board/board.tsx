import type { Dashboard } from "@doska/core/types"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BoardHeader } from "@/components/board/board-header"
import { BoardList } from "@/components/board/board-list"
import { SyncIndicator } from "@/components/shell/sync-indicator"

interface IProps {
  board: Dashboard
}

export function Board({ board }: IProps) {
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1">
      <BoardHeader board={board} />
      <BoardList key={board.id} board={board} />
      <View
        style={{ bottom: insets.bottom + 16 }}
        className="absolute right-4 z-50"
      >
        <SyncIndicator />
      </View>
    </View>
  )
}
