import { Anchor } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface IProps {
  title?: string
}

/**
 * A public board's top bar
 */
export function PublicHeader({ title }: IProps) {
  return (
    <header className="flex h-11.5 shrink-0 items-center gap-2 border-b px-4">
      <a
        href="https://doska.sh"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1 rounded-md px-2 hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
      >
        <Anchor className="size-4 shrink-0" />
        <span className="font-semibold">Doska</span>
      </a>
      {title && (
        <>
          <span className="-ml-1.5">/</span>
          <span className="min-w-0 truncate text-base font-semibold">
            {title}
          </span>
        </>
      )}
      <span className="flex-1" />
      <ThemeToggle />
    </header>
  )
}
