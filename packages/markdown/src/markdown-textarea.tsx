import { cn } from "@doska/ui-kit"
import { useRef } from "react"
import { Markdown } from "./markdown"
import { useMarkers } from "./markers"
import { type SlashCommand } from "./slash-menu"
import { toggleTaskByIndex } from "./task-progress"
import type { Marker } from "./markers"
import { SlashMenu } from "./slash-menu/slash-menu"

interface IProps extends React.ComponentProps<"textarea"> {
  isPreview?: boolean
  value?: string
  markers?: Marker[]
  onToggleTask?: (value: string) => void
  /** Enables the `/` slash command menu. Off by default. */
  slashMenu?: boolean
  /** Overrides the default slash commands. */
  slashCommands?: SlashCommand[]
  /** Required when `slashMenu` is on, to apply inserted commands. */
  onChangeValue?: (value: string) => void
  containerClassName?: string
}

const NO_MARKERS: Marker[] = []
const NOOP = () => {}

export function MarkdownTextarea({
  isPreview,
  markers = NO_MARKERS,
  onToggleTask,
  slashMenu,
  slashCommands,
  onChangeValue,
  containerClassName,
  ...props
}: IProps) {
  const value = typeof props.value === "string" ? props.value : ""
  const { body } = useMarkers(value, markers, "preview")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (isPreview)
    return (
      <div
        className={cn(
          "min-h-0 space-y-4 overflow-y-auto pt-3 select-text",
          containerClassName
        )}
      >
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
    <div
      className={cn(
        "relative flex min-h-0 w-full flex-col",
        containerClassName
      )}
    >
      <textarea
        {...props}
        ref={textareaRef}
        className={cn(
          "w-full resize-none bg-transparent outline-none",
          "placeholder:text-muted-foreground/50",
          "field-sizing-content py-2 font-mono",
          "text-base leading-relaxed [font-variant-ligatures:none]",
          props.className
        )}
      />
      {slashMenu && (
        <SlashMenu
          textareaRef={textareaRef}
          value={value}
          onChangeValue={onChangeValue ?? NOOP}
          commands={slashCommands}
        />
      )}
    </div>
  )
}
