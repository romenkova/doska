import { useEffect, useState } from "react"
import { useLocation, useRoute } from "wouter"
import type { DigestFilter } from "@/lib/api/operations"
import { sync } from "@/lib/api/sync"
import { useDashboards, useDigest } from "@/lib/data/queries"
import { routes } from "@/lib/routes"
import { Digest } from "./digest"

/** Connects the digest to its data, and pulls every board so it isn't reading a
 * partial picture — only the open board syncs during normal use. */
export function DigestView() {
  const [, navigate] = useLocation()
  const [, params] = useRoute(routes.card.pattern)
  const [filter, setFilter] = useState<DigestFilter>("week")

  const { data: dashboards = [] } = useDashboards()
  const { data: entries = [], isPending, error } = useDigest(filter)

  // The board list is what defines "every board", so this waits for it rather
  // than firing on mount. Re-running when a board is added is the point.
  const boardIds = dashboards.map((d) => d.id).join(",")
  useEffect(() => {
    if (!boardIds) return
    void sync.reconcileBoards(boardIds.split(","))
  }, [boardIds])

  return (
    <Digest
      filter={filter}
      onChangeFilter={setFilter}
      entries={entries}
      isLoading={isPending}
      error={error}
      openCardId={params?.id ?? null}
      onOpenCard={(entry) => navigate(routes.card.to(entry.card.id))}
    />
  )
}
