import { cn } from "@deck/ui-kit"
import { Markdown } from "./markdown"

interface IProps extends React.ComponentProps<"textarea"> {
  isPreview?: boolean
  value?: string
}

export function MarkdownTextarea({ isPreview, ...props }: IProps) {
  if (isPreview)
    return (
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-3 select-text">
        {props.value && <Markdown>{props.value}</Markdown>}
      </div>
    )
  return (
    <textarea
      className={cn(
        "w-full resize-none bg-transparent outline-none",
        "placeholder:text-muted-foreground/50",
        "field-sizing-content py-2 font-mono",
        "text-base leading-relaxed [font-variant-ligatures:none]"
      )}
      {...props}
    />
  )
}
