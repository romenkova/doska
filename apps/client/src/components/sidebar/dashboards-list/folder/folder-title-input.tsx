import { useState } from "react"

interface IProps {
  value: string
  onCommit: (title: string) => void
  onDone: () => void
}

export function FolderTitleInput({ value, onCommit, onDone }: IProps) {
  const [draft, setDraft] = useState(value)

  function commit() {
    const next = draft.trim()
    if (next && next !== value) onCommit(next)
    onDone()
  }

  return (
    <input
      value={draft}
      autoFocus
      autoComplete="off"
      spellCheck={false}
      aria-label="Folder name"
      onFocus={(e) => e.target.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") onDone()
      }}
      className="h-8 w-full rounded-md bg-sidebar-accent/50 px-2 text-sm outline-none"
    />
  )
}
