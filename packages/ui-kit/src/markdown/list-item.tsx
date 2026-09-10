import type { ReactNode } from "react"

export function MdListItem({ children }: { children: ReactNode }) {
  return <li className="my-1 pl-1">{children}</li>
}
