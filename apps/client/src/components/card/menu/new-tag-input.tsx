import { toTagName } from "@doska/markdown"
import { CornerDownLeft } from "lucide-react"
import { useState } from "react"

interface IProps {
  onChangeQuery: (query: string) => void
  onAdd: (tag: string) => void
}

export function NewTagInput({ onChangeQuery, onAdd }: IProps) {
  const [value, setValue] = useState("")
  const tag = toTagName(value)

  function change(next: string) {
    setValue(next)
    onChangeQuery(next)
  }

  return (
    <div className="flex items-center gap-2 px-3">
      <input
        value={value}
        placeholder="Add tag…"
        aria-label="Add tag"
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Escape") e.stopPropagation()
          if (e.key !== "Enter" || !tag) return
          onAdd(tag)
          change("")
        }}
        className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      {tag && (
        <CornerDownLeft
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      )}
    </div>
  )
}
