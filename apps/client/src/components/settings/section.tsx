import type { ReactNode } from "react"

interface IProps {
  title?: string
  children: ReactNode
}

export function SettingsSection({ title, children }: IProps) {
  return (
    <section className="flex flex-col gap-3 border-t border-border px-3 py-4 first:border-t-0">
      {title && <h3 className="text-sm font-medium">{title}</h3>}
      {children}
    </section>
  )
}
