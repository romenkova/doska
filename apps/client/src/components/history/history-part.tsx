import type { EntryPart, Member } from "@doska/core"
import { ArrowRight } from "lucide-react"
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
