import { Button } from "@doska/ui-kit"
import { toTagName } from "@doska/markdown"
import { Hash, Trash2 } from "lucide-react"
import { useState } from "react"
import { TagColorMenu } from "./tag-color-menu"

interface IProps {
  name: string
  hint?: string
  color: string
  onChangeColor: ((color: string) => void) | null
  onRename: (to: string) => void
  onDelete: () => void
}

export function TagRow({
  name,
  hint,
  color,
  onChangeColor,
  onRename,
  onDelete,
}: IProps) {
  const [value, setValue] = useState(name)

  function commit() {
    const next = toTagName(value)
    if (!next || next === name) {
      setValue(name)
      return
    }
    onRename(next)
  }

  return (
    <li className="flex items-center gap-2">
      {onChangeColor ? (
        <TagColorMenu tag={name} color={color} onChange={onChangeColor} />
      ) : (
        <Hash className="size-4 shrink-0 text-muted-foreground" />
      )}
      <input
        value={value}
        aria-label={`Rename #${name}`}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            e.stopPropagation()
            setValue(name)
          }
        }}
        className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-sm outline-none hover:bg-muted focus:bg-muted"
      />
      <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete #${name}`}
        className="text-muted-foreground"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  )
}
