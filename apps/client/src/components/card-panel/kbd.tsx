import { cn } from "@doska/ui-kit"

interface IProps {
  children: string
}

export function Kbd({ children }: IProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-md border bg-background px-1.5",
        "font-mono text-xs font-medium text-foreground/80 shadow-[inset_0_-1px_0_var(--border)]"
      )}
    >
      {children}
    </kbd>
  )
}
