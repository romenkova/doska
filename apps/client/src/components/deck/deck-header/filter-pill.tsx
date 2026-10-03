import { TagChip } from "@doska/ui-kit"
import { AtSign, Hash, X } from "lucide-react"

interface IProps {
  label: string
  prefix: "#" | "@"
  onClear: () => void
}

/** One active filter, cleared by clicking it. */
export function FilterPill({ label, prefix, onClear }: IProps) {
  return (
    <button
      type="button"
      title={`Stop filtering by ${prefix}${label}`}
      aria-label={`Clear ${prefix}${label} filter`}
      onClick={onClear}
      className="group inline-flex cursor-pointer"
    >
      <TagChip
        label={label}
        icon={prefix === "@" ? AtSign : Hash}
        className="transition-colors group-hover:border-primary/50"
      >
        <X className="mt-[1px] ml-0.5 size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
      </TagChip>
    </button>
  )
}
