import { TagChip } from "@doska/ui-kit"
import { AtSign } from "lucide-react"
import { useBoardMembers } from "@doska/core"
import { useDeck } from "@/providers/deck/deck-context"
import { useAuth } from "@/lib/hooks"

export function CardUsers({ userIds }: { userIds: string[] }) {
  const { id: deckId } = useDeck()
  const { authed } = useAuth()
  const { data: roster } = useBoardMembers(deckId, !!authed)

  const tagged = (roster?.members ?? []).filter((member) =>
    userIds.includes(member.userId)
  )

  return tagged.map((member) => (
    <TagChip key={member.userId} label={member.username} icon={AtSign} />
  ))
}
