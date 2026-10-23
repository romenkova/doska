import type { ReactNode } from "react"

interface IProps {
  label: string
  onClick: () => void
  children: ReactNode
}

export function RowButton({ label, onClick, children }: IProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="grid size-6 place-items-center rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
    >
      {children}
    </button>
  )
}
