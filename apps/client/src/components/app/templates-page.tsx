import { useEffect } from "react"
import { TemplatesView } from "@/components/templates/templates-view"
import { sync } from "@doska/core"
import { AppShell } from "./app-shell"

const NO_DECK = { id: "", sort: [] }

export function TemplatesPage() {
  useEffect(() => {
    sync.setActiveBoard(null)
  }, [])

  return (
    <AppShell deck={NO_DECK}>
      <TemplatesView />
    </AppShell>
  )
}
