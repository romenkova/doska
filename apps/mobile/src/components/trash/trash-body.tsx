import { purgeExpired } from "@doska/core/operations"
import { useTrash } from "@doska/core/queries"
import { EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { useEffect } from "react"
import { TrashList } from "@/components/trash/trash-list"

interface IProps {
  boardIds: string[]
}

export function TrashBody({ boardIds }: IProps) {
  const { data: entries = [], isPending, error, refetch } = useTrash()

  // Opening the trash is the moment stale entries would be visible, so sweep
  // first and re-read whatever the sweep removed.
  useEffect(() => {
    void purgeExpired().then((purged) => {
      if (purged > 0) void refetch()
    })
  }, [refetch])

  if (error) {
    return (
      <EmptyState message="Couldn't read the trash. Close the app and open it again." />
    )
  }

  if (isPending) return <Spinner />

  if (entries.length === 0) {
    return <EmptyState message="The trash is empty." />
  }

  return <TrashList entries={entries} boardIds={boardIds} />
}
