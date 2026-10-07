import type { HistoryEntry } from "@doska/core"
import { HistoryRow } from "./history-row"

interface IProps {
  entries: HistoryEntry[]
}

export function HistoryList({ entries }: IProps) {
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">No history yet</p>

  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <HistoryRow key={entry.id} entry={entry} />
      ))}
    </ul>
  )
}
