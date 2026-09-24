import { useDashboards } from "@doska/core/queries"
import { sync } from "@doska/core/sync"
import { useFocusEffect } from "expo-router"
import { useCallback, useEffect } from "react"
import { View } from "react-native"
import { ScreenHeader, ScreenTitle } from "@/components/shell/screen-header"
import { TrashBody } from "@/components/trash/trash-body"

export default function TrashScreen() {
  const { data: dashboards = [] } = useDashboards()

  useFocusEffect(
    useCallback(() => {
      sync.setActiveBoard(null)
    }, [])
  )

  const boardIds = dashboards.map((dashboard) => dashboard.id).join(",")
  useEffect(() => {
    if (!boardIds) return
    void sync.reconcileBoards(boardIds.split(","))
  }, [boardIds])

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>
        <ScreenTitle>Trash</ScreenTitle>
      </ScreenHeader>

      <TrashBody boardIds={boardIds ? boardIds.split(",") : []} />
    </View>
  )
}
