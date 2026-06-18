import { useEffect, useRef, useState } from "react"
import { Button, SidebarTrigger } from "@/components/ui"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"

interface IProps {
  title: string
  onRename: (name: string) => void
  onDelete: () => void
}

export function DeckHeader({ title, onRename, onDelete }: IProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEditing() {
    setDraft(title)
    setEditing(true)
  }

  function commit() {
    const next = draft.trim()
    if (next && next !== title) onRename(next)
    setEditing(false)
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") setEditing(false)
          }}
          aria-label="Board name"
          className={cn(
            "min-w-67.5 bg-transparent px-2 py-0.5",
            "rounded-sm bg-secondary text-base font-semibold outline-none"
          )}
        />
      ) : (
        <h1
          onClick={startEditing}
          title="Click to rename"
          className="min-w-67.5 cursor-text px-2 text-base font-semibold"
        >
          {title}
        </h1>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete board"
        onClick={onDelete}
        className="ml-auto text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </header>
  )
}
