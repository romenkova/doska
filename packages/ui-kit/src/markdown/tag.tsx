import type { LucideIcon } from "lucide-react"
import type { KeyboardEvent, MouseEvent } from "react"
import { TagChip } from "../tag-chip"

interface IProps {
  name: string
  onSelect?: () => void
  icon?: LucideIcon
  title?: string
}

/** A `#tag` in a card body. */
export function MdTag({ name, onSelect, icon, title }: IProps) {
  if (!onSelect)
    return <TagChip label={name} icon={icon} className="mx-[0.1em]" />

  const activate = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title={title ?? `Show cards tagged #${name}`}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") activate(e)
      }}
      className="mx-[0.1em] inline-flex cursor-pointer rounded-[0.5rem]"
    >
      <TagChip
        label={name}
        icon={icon}
        className="transition-colors hover:border-primary/50"
      />
    </span>
  )
}
