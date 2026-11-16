import { CardContent, MdTag, cn, columnHue } from "@doska/ui-kit"
import { tagColor, useBoardMembers, useTagColors } from "@doska/core"
import { AtSign } from "lucide-react"
import { useDeck } from "@/providers/deck/deck-context"
import { useAuth } from "@/lib/hooks"
import { TagContextMenu } from "./tag-context-menu"

interface IProps {
  tags: string[]
  users: string[]
  className?: string
}

export function CardTags({ tags, users, className }: IProps) {
  const { id: deckId, toggleTagFilter, toggleUserFilter } = useDeck()
  const { authed } = useAuth()
  const { data: roster } = useBoardMembers(deckId, !!authed)
  const tagColors = useTagColors(deckId)

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
        <TagContextMenu key={tag} tag={tag}>
          <MdTag
            name={tag}
            hue={columnHue(tagColor(tagColors, tag))}
            onSelect={toggleTagFilter && (() => toggleTagFilter(tag))}
          />
        </TagContextMenu>
      ))}
    </CardContent>
  )
}
