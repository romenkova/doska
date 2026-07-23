import { Card as CardBase, cn } from "@doska/ui-kit"
import { CircleCheckBig } from "lucide-react"
import type { DigestCard } from "@/lib/api/operations"
import { ColumnTag } from "../column/column-tag"

interface IProps {
  entry: DigestCard
  isActive: boolean
  onOpen: () => void
}

/**
 * One card in the digest: what it is, where it lives, and when it's due. The
 * trailing columns are fixed-width so they line up down the list — a digest is
 * read by scanning a column, not a row. Read-only except the deadline, which
 * stays editable so a card can be rescheduled without leaving the digest.
 */
export function DigestRow({ entry, isActive, onOpen }: IProps) {
  const { card, boardTitle, columnTitle, columnColor, isDone } = entry

  return (
    <li>
      <CardBase
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return
          e.preventDefault()
          onOpen()
        }}
        className={cn(
          // Overrides the card's stacked layout: a digest card is one line.
          "cursor-pointer flex-row items-center gap-3 rounded-xl px-3",
          "hover:ring-foreground/20",
          isActive && "ring-2 ring-primary/40",
          isDone && "opacity-40"
        )}
      >
        {isDone && (
          <CircleCheckBig className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn("truncate text-sm", isDone && "line-through")}>
            {card.title || "Untitled card"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {boardTitle || "Untitled board"}
          </span>
        </span>
        <span className="flex w-28 shrink-0 justify-end">
          {columnTitle && <ColumnTag title={columnTitle} color={columnColor} />}
        </span>
      </CardBase>
    </li>
  )
}
