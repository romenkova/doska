import type { EntryPart, Member } from "@doska/core"
import { ModalClose } from "@doska/ui-kit"
import { ArrowRight } from "lucide-react"
import { Link } from "wouter"
import { routes } from "@/lib/routes"
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
      if (part.boardId)
        return (
          <ModalClose
            nativeButton={false}
            render={<Link to={`~${routes.deck.to(part.boardId)}`} />}
            className="font-medium text-foreground hover:underline"
          >
            {part.text}
          </ModalClose>
        )
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
