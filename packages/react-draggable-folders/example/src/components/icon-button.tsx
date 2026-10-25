import type { ReactNode } from "react"

interface IProps {
  label: string
  onClick: () => void
  children: ReactNode
}

export function IconButton({ label, onClick, children }: IProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(event) => {
        // Folder rows toggle on click
        event.stopPropagation()
        onClick()
      }}
      className="grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  )
}
