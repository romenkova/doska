import type { ReactNode } from "react"
import { cn } from "../lib/cn"

interface IProps {
  href?: string
  children: ReactNode
}

export function Badge({ href, children }: IProps) {
  const className = cn(
    "inline-flex h-6 items-center rounded-full bg-zinc-100 px-2.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800",
    href &&
      "hover:bg-zinc-200 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
  )
  if (!href) return <span className={className}>{children}</span>
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
