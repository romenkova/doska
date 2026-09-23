import type { Dashboard } from "@doska/core/types"
import { toggleTag } from "@doska/core/utils"
import { useState } from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BoardHeader } from "@/components/board/board-header"
import { BoardList } from "@/components/board/board-list"
import { TagFilterPills } from "@/components/board/tag-filter-pills"
import { SyncIndicator } from "@/components/shell/sync-indicator"

interface IProps {
  board: Dashboard
}

export function Board({ board }: IProps) {
  const insets = useSafeAreaInsets()
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [lastBoardId, setLastBoardId] = useState(board.id)

  if (board.id !== lastBoardId) {
    setLastBoardId(board.id)
    setTagFilters([])
  }

  const toggleTagFilter = (tag: string) =>
    setTagFilters((tags) => toggleTag(tags, tag))

  return (
    <View className="flex-1">
      <BoardHeader board={board} />
      <TagFilterPills tags={tagFilters} onPressTag={toggleTagFilter} />
      <BoardList
        key={board.id}
        board={board}
        tagFilters={tagFilters}
        onPressTag={toggleTagFilter}
      />
      <View
        style={{ bottom: insets.bottom + 16 }}
        className="absolute right-4 z-50"
      >
        <SyncIndicator />
      </View>
    </View>
  )
}
