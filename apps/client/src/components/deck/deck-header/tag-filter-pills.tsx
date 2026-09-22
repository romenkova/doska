import { TagChip } from "@doska/ui-kit"
import { X } from "lucide-react"
import { useDeck } from "@/providers/deck/deck-context"

/** The strip under the board header listing the active tag filters. */
export function TagFilterPills() {
  const { tagFilters = [], toggleTagFilter } = useDeck()
  if (!toggleTagFilter || tagFilters.length === 0) return null

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-1.5">
      {tagFilters.map((tag) => (
        <button
          key={tag}
          type="button"
          title={`Stop filtering by #${tag}`}
          aria-label={`Clear #${tag} filter`}
          onClick={() => toggleTagFilter(tag)}
          className="group inline-flex cursor-pointer"
        >
          <TagChip
            label={tag}
            className="transition-colors group-hover:border-primary/50"
          >
            <X className="mt-[1px] ml-0.5 size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
          </TagChip>
        </button>
      ))}
    </div>
  )
}
