import type { EntryPart, Member } from "@doska/core"
import { ArrowRight } from "lucide-react"
import { HistoryCardTitle } from "./history-card-title"
import { HistoryChip } from "./history-chip"

interface IProps {
  part: EntryPart
  members: Member[]
}

export function HistoryPart({ part, members }: IProps) {
  switch (part.kind) {
    case "text":
      return part.text
    case "title":
      if (part.cardId)
        return <HistoryCardTitle cardId={part.cardId} title={part.text} />
      return <span className="font-medium text-foreground">{part.text}</span>
    case "chip":
      return <HistoryChip label={part.text} board={part.board} />
    case "user": {
      const member = members.find((member) => member.userId === part.userId)
      return <HistoryChip label={member?.username ?? "Unknown"} />
    }
    case "arrow":
      return (
        <ArrowRight className="inline size-3.5 align-middle text-muted-foreground" />
      )
  }
}
