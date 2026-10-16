import { CardContent, MdTag, cn } from "@doska/ui-kit"
import { useBoardMembers } from "@doska/core"
import { AtSign } from "lucide-react"
import { useDeck } from "@/providers/deck/deck-context"
import { useAuth } from "@/lib/hooks"

interface IProps {
  tags: string[]
  users: string[]
  className?: string
}

export function CardTags({ tags, users, className }: IProps) {
  const { id: deckId, toggleTagFilter, toggleUserFilter } = useDeck()
  const { authed } = useAuth()
  const { data: roster } = useBoardMembers(deckId, !!authed)

  const members = (roster?.members ?? []).filter((member) =>
    users.includes(member.userId)
  )
  if (tags.length === 0 && members.length === 0) return null

  return (
    <CardContent className={cn("flex flex-wrap gap-1 pt-2", className)}>
      {members.map((member) => (
        <MdTag
          key={member.userId}
          name={member.username}
          icon={AtSign}
          title={`Show cards assigned to @${member.username}`}
          onSelect={toggleUserFilter && (() => toggleUserFilter(member.userId))}
        />
      ))}
      {tags.map((tag) => (
        <MdTag
          key={tag}
          name={tag}
          onSelect={toggleTagFilter && (() => toggleTagFilter(tag))}
        />
      ))}
    </CardContent>
  )
}
