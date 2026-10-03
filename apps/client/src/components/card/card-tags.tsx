import { CardContent, MdTag, cn } from "@doska/ui-kit"
import { useMarkdownRenderers } from "@doska/markdown"
import { CardUsers } from "./card-users"

interface IProps {
  tags: string[]
  users: string[]
  className?: string
}

export function CardTags({ tags, users, className }: IProps) {
  const { onTagClick } = useMarkdownRenderers()

  return (
    <CardContent className={cn("flex flex-wrap gap-1 pt-2", className)}>
      {users.length > 0 && <CardUsers userIds={users} />}
      {tags.map((tag) => (
        <MdTag
          key={tag}
          name={tag}
          onSelect={onTagClick && (() => onTagClick(tag))}
        />
      ))}
    </CardContent>
  )
}
