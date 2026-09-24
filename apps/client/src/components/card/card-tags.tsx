import { CardContent, MdTag, cn } from "@doska/ui-kit"
import { useMarkdownRenderers } from "@doska/markdown"

interface IProps {
  tags: string[]
  className?: string
}

export function CardTags({ tags, className }: IProps) {
  const { onTagClick } = useMarkdownRenderers()

  return (
    <CardContent className={cn("flex flex-wrap gap-1 pt-2", className)}>
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
