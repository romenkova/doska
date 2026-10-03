import type { DigestCard, DigestFilter, DigestGroup } from "@doska/core"
import { DigestBody } from "./digest-body"
import { DigestHeader } from "./digest-header"

interface IProps {
  filter: DigestFilter
  onChangeFilter: (filter: DigestFilter) => void
  groups: DigestGroup[]
  isLoading: boolean
  /** A failed read renders as a failure, not as an empty week. */
  error: Error | null
  hideDone: boolean
  onToggleHideDone: () => void
  /** The card open in the panel, highlighted in the list. */
  openCardId: string | null
  onOpenCard: (entry: DigestCard) => void
}

/** Every deadlined card across every board, in date order. */
export function Digest({
  filter,
  onChangeFilter,
  groups,
  isLoading,
  error,
  hideDone,
  onToggleHideDone,
  openCardId,
  onOpenCard,
}: IProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <DigestHeader
        filter={filter}
        onChangeFilter={onChangeFilter}
        hideDone={hideDone}
        onToggleHideDone={onToggleHideDone}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-10 sm:px-4">
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
