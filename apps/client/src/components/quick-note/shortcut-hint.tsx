import { cn } from "@doska/ui-kit"

interface IProps {
  keys: string
  label: string
  onClick: () => void
}

export function ShortcutHint({ keys, label, onClick }: IProps) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-1.5 py-1 outline-none",
        "hover:bg-muted hover:text-foreground focus-visible:bg-muted"
      )}
    >
      <kbd
        className={cn(
          "inline-flex h-6 min-w-6 items-center justify-center rounded-md border bg-background px-1.5",
          "font-mono text-xs font-medium text-foreground/80 shadow-[inset_0_-1px_0_var(--border)]"
        )}
      >
        {keys}
      </kbd>
      <span>{label}</span>
    </button>
  )
}
