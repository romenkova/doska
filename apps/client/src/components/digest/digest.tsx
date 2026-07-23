import { todayIso } from "@doska/ui-kit"
import { useState } from "react"
import { type DigestCard, type DigestFilter } from "@/lib/api/operations"
import { DigestBody } from "./digest-body"
import { DigestHeader } from "./digest-header"
import { group } from "./group"

interface IProps {
  filter: DigestFilter
  onChangeFilter: (filter: DigestFilter) => void
  entries: DigestCard[]
  isLoading: boolean
  /** A failed read renders as a failure, not as an empty week. */
  error: Error | null
  /** The card open in the panel, highlighted in the list. */
  openCardId: string | null
  onOpenCard: (entry: DigestCard) => void
}

/** Every deadlined card across every board, in date order. */
export function Digest({
  filter,
  onChangeFilter,
  entries,
  isLoading,
  error,
  openCardId,
  onOpenCard,
}: IProps) {
  const [hideDone, setHideDone] = useState(false)
  const visible = hideDone ? entries.filter((e) => !e.isDone) : entries
  const groups = group(visible, todayIso())

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DigestHeader
        filter={filter}
        onChangeFilter={onChangeFilter}
        hideDone={hideDone}
        onToggleHideDone={() => setHideDone((v) => !v)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-10 sm:px-4">
        <div className="mx-auto max-w-lg">
          <DigestBody
            error={error}
            isLoading={isLoading}
            groups={groups}
            filter={filter}
            openCardId={openCardId}
            onOpenCard={onOpenCard}
          />
        </div>
      </div>
    </div>
  )
}
