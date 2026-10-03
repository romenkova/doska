import { cardDisplayId } from "@doska/contract"
import type { SearchHit, Segment } from "@doska/core"
import { cn } from "@doska/ui-kit"
import { useEffect, useRef } from "react"
import { ColumnSwatch } from "../column/column-swatch"

/** Matched runs as `<mark>`, weight only — a highlighter pen in a list is noise. */
function Segments({ segments }: { segments: Segment[] }) {
  return segments.map((run, index) =>
    run.hit ? (
      <mark key={index} className="bg-transparent font-semibold text-inherit">
        {run.text}
      </mark>
    ) : (
      <span key={index}>{run.text}</span>
    )
  )
}

interface IProps {
  id: string
  hit: SearchHit
  active: boolean
  onSelect: () => void
  onHighlight: () => void
}

export function SearchResultRow({
  id,
  hit,
  active,
  onSelect,
  onHighlight,
}: IProps) {
  const ref = useRef<HTMLButtonElement>(null)

  // Keep the keyboard-highlighted row scrolled into view.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" })
  }, [active])

  const displayId = cardDisplayId(hit.card.number)

  return (
    <button
      ref={ref}
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      // Move, not enter: as the list shrinks under a still cursor the rows slide
      // up into it, and `mouseenter` would hand the highlight to whichever row
      // happened to land there — usually the last one, which then scrolls into
      // view. Only a cursor that actually moved gets to steal it from the keyboard.
      onMouseMove={() => {
        if (!active) onHighlight()
      }}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left",
        "md:last:rounded-b-xl",
        active && "bg-accent text-accent-foreground"
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-base">
          <Segments segments={hit.title} />
        </span>
        {hit.snippet && (
          <span className="line-clamp-1 text-muted-foreground">
            <Segments segments={hit.snippet} />
          </span>
        )}
        {displayId && (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            #{displayId}
          </span>
        )}
      </span>
      {hit.column && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <ColumnSwatch color={hit.column.color} />
          <span className="line-clamp-1 max-w-32">{hit.column.title}</span>
        </span>
      )}
    </button>
  )
}
