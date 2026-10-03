import { useEffect } from "react"
import { TrashView } from "@/components/trash/trash-view"
import { sync } from "@doska/core"
import { AppShell } from "./app-shell"

const NO_DECK = { id: "", sort: [] }

/** Deleted boards, columns and cards, at `/trash`. */
export function TrashPage() {
  useEffect(() => {
    sync.setActiveBoard(null)
  }, [])

  return (
    <AppShell deck={NO_DECK}>
      <TrashView />
    </AppShell>
  )
}
