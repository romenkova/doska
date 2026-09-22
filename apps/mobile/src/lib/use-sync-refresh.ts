import { sync } from "@doska/core/sync"
import { useCallback, useState } from "react"

interface SyncRefresh {
  refreshing: boolean
  onRefresh: () => void
}

/**
 * Pull-to-refresh for a list: pulls the named boards once. This is the mobile
 * form of the web's manual sync shortcut.
 */
export function useSyncRefresh(boardIds: string[]): SyncRefresh {
  const [refreshing, setRefreshing] = useState(false)
  // The caller rebuilds the array each render, so key the callback off contents.
  const key = boardIds.join(",")

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    const ids = key ? key.split(",") : []
    void sync.reconcileBoards(ids).finally(() => setRefreshing(false))
  }, [key])

  return { refreshing, onRefresh }
}
