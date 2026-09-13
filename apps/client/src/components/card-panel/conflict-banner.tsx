import { Button, cn } from "@doska/ui-kit"
import { diffBody } from "@doska/merge"
import { TriangleAlert } from "lucide-react"
import { useState } from "react"
import type { Card } from "@doska/core/types"
import { diffHunks } from "./diff-hunks"

const LINE_BY_KIND = {
  same: "text-muted-foreground",
  added: "bg-emerald-500/15 text-foreground",
  removed: "bg-destructive/10 text-muted-foreground line-through",
  gap: "text-muted-foreground/50",
}

interface IProps {
  body: string
  conflict: NonNullable<Card["bodyConflict"]>
  onKeepMine: () => void
  onUseTheirs: () => void
}

export function ConflictBanner({
  body,
  conflict,
  onKeepMine,
  onUseTheirs,
}: IProps) {
  const [showAll, setShowAll] = useState(false)
  const lines = diffBody(body, conflict.body)
  const hunks = diffHunks(lines, 1)
  const canFold = hunks.length < lines.length
  const rows = showAll ? lines : hunks

  return (
    <div
      role="status"
      className={cn("mx-4 mt-2 rounded-lg px-3 py-2 text-sm", "border")}
    >
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          This card was edited in two places at once.
          <br /> The other version is below.
        </p>
      </div>
      <pre className="my-4 space-y-0.5 overflow-x-auto font-mono text-xs whitespace-pre-wrap">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn("rounded-sm px-2 py-0.5", LINE_BY_KIND[row.kind])}
          >
            {row.kind === "gap" ? "⋯" : row.text || " "}
          </div>
        ))}
      </pre>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onKeepMine}>
          Keep mine
        </Button>
        <Button size="sm" variant="secondary" onClick={onUseTheirs}>
          Use theirs
        </Button>
        {canFold && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : "Show all"}
          </Button>
        )}
      </div>
    </div>
  )
}
