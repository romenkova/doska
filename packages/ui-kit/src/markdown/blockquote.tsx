import type { ReactNode } from "react"

export function MdBlockquote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-3 border-l-3 border-l-[color-mix(in_oklab,var(--primary)_40%,var(--muted))] py-0.5 pl-3">
      {children}
    </blockquote>
  )
}
