import { useEffect, useState } from "react"
import { useLocation, useRoute } from "wouter"
import {
  groupByDeadline,
  type DigestFilter,
  sync,
  useDashboards,
  useDigest,
} from "@doska/core"
import { routes } from "@/lib/routes"
import { Digest } from "./digest"

/** Connects the digest to its data, and pulls every board so it isn't reading a
 * partial picture — only the open board syncs during normal use. */
export function DigestView() {
  const [, navigate] = useLocation()
  const [, params] = useRoute(routes.card.pattern)
  const [filter, setFilter] = useState<DigestFilter>("week")
  const [hideDone, setHideDone] = useState(false)

  const { data: dashboards = [] } = useDashboards()
  const { data: entries = [], isPending, error } = useDigest(filter)

  // The board list is what defines "every board", so this waits for it rather
  // than firing on mount. Re-running when a board is added is the point.
  const boardIds = dashboards.map((d) => d.id).join(",")
  useEffect(() => {
    if (!boardIds) return
    void sync.watchBoards(boardIds.split(","))
    return () => void sync.watchBoards([])
  }, [boardIds])

  const visible = hideDone ? entries.filter((e) => !e.isDone) : entries

  return (
    <Digest
      filter={filter}
      onChangeFilter={setFilter}
      groups={groupByDeadline(visible)}
      isLoading={isPending}
      error={error}
      hideDone={hideDone}
      onToggleHideDone={() => setHideDone((v) => !v)}
      openCardId={params?.id ?? null}
      onOpenCard={(entry) => navigate(routes.card.to(entry.card.id))}
    />
  )
}
