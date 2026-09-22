import { cn } from "@doska/ui-kit"
import type { SlashCommand } from "@doska/markdown"

interface IProps {
  commands: SlashCommand[]
  onSelect: (command: SlashCommand) => void
  className?: string
  style?: React.CSSProperties
}

/** The popover list of slash commands behind the mobile `/` button. */
export function SlashCommandList({
  commands,
  onSelect,
  className,
  style,
}: IProps) {
  return (
    <div
      className={cn(
        "max-h-(--menu-max-height,16rem) w-70 overflow-y-auto py-1",
        "rounded-lg border bg-popover text-popover-foreground shadow-e3",
        className
      )}
      style={style}
      // Keep the editor focused (caret/keyboard intact) when tapping an item.
      onPointerDown={(e) => e.preventDefault()}
    >
      {commands.map((command) => (
        <button
          key={command.id}
          type="button"
          onClick={() => onSelect(command)}
          className="flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm active:bg-accent active:text-accent-foreground"
        >
          <span className="line-clamp-1 max-w-60 font-medium">
            {command.title}
          </span>
          {command.hint && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {command.hint}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
