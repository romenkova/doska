import { Check } from "lucide-react"
import type { KeyboardEvent, MouseEvent } from "react"
import { cn } from "../lib/cn"

interface IProps {
  /** The raw `[[target]]`, e.g. `12`. */
  target: string
  /** What to show for the target — either resolved, or written into the text. */
  label?: string
  /** The target names no real card, whatever label the text gave it. */
  unresolved?: boolean
  /** Trailing detail — a status, a category. */
  badge?: string
  /** oklch hue tinting the badge; neutral without one. */
  hue?: number | null
  /** The target sits in the board's done column. */
  done?: boolean
  archived?: boolean
  title?: string
  onOpen?: () => void
}

const SEGMENT =
  "inline box-decoration-clone bg-muted px-[0.5em] py-[0.15em] text-muted-foreground"

/**
 * A `[[target]]` reference
 */
export function MdWikilink({
  target,
  label,
  unresolved,
  badge,
  hue,
  done,
  archived,
  title,
  onOpen,
}: IProps) {
  const activate = (e: MouseEvent | KeyboardEvent) => {
    if (!onOpen) return
    e.preventDefault()
    // The chip sits inside the board card's own open-detail handler.
    e.stopPropagation()
    onOpen()
  }

  if (unresolved || !label)
    return (
      <span
        className="wikilink inline text-[0.9em] leading-[1.6] not-italic"
        title={title}
      >
        <span className="wikilink-target inline text-muted-foreground underline decoration-dashed underline-offset-2">
          {label ? `${target} — ${label}` : target}
        </span>
      </span>
    )

  return (
    <span
      role={onOpen ? "link" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      title={title}
      onClick={onOpen && activate}
      onKeyDown={
        onOpen &&
        ((e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") activate(e)
        })
      }
      className={cn(
        "wikilink inline leading-[1.6] not-italic",
        "transition-[filter] duration-150",
        "hover:brightness-[0.96] hover:saturate-[1.1] dark:hover:brightness-[1.15]",
        onOpen && "cursor-pointer",
        archived && "opacity-60"
      )}
    >
      <span
        className={cn(
          SEGMENT,
          "wikilink-label relative inline-block overflow-hidden",
          "rounded-md text-card-foreground inline-flex gap-1.5"
        )}
      >
        {badge && (
          <span
            className={cn(
              "wikilink-badge w-1 rounded-full shrink-0 block grow my-1",
              hue == null && "bg-muted-foreground/40"
            )}
            style={
              hue == null
                ? undefined
                : { background: `oklch(0.72 0.14 ${hue})` }
            }
          />
        )}
        <span className={cn("leading-4.5 py-0.5", archived && "line-through")}>
          {label}
        </span>
        {done && <Check className="inline size-3 mt-1.5 shrink-0" />}
      </span>
    </span>
  )
}
