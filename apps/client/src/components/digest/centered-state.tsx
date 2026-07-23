import type { ReactNode } from "react"

/** Centered icon-and-message block, shared by the error and empty states. */
export function CenteredState({
  icon,
  children,
}: {
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {icon}
      {children}
    </div>
  )
}
