import { cn } from "@doska/ui-kit"
import { Markdown } from "./markdown"
import { useMarkers } from "./markers"
import { toggleTaskByIndex } from "./task-progress"
import type { Marker } from "./markers"

interface IProps extends React.ComponentProps<"textarea"> {
  isPreview?: boolean
  value?: string
  markers?: Marker[]
  onToggleTask?: (value: string) => void
}

const NO_MARKERS: Marker[] = []

export function MarkdownTextarea({
  isPreview,
  markers = NO_MARKERS,
  onToggleTask,
  ...props
}: IProps) {
  const value = typeof props.value === "string" ? props.value : ""
  const { body } = useMarkers(value, markers, "preview")

  if (isPreview)
    return (
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-3 select-text">
        {body && (
          <Markdown
            onToggleTask={
              onToggleTask
                ? (index) => onToggleTask(toggleTaskByIndex(value, index))
                : undefined
            }
          >
            {body}
          </Markdown>
        )}
      </div>
    )
  return (
    <textarea
      {...props}
      className={cn(
        "w-full resize-none bg-transparent outline-none",
        "placeholder:text-muted-foreground/50",
        "field-sizing-content py-2 font-mono",
        "text-base leading-relaxed [font-variant-ligatures:none]",
        props.className
      )}
    />
  )
}
