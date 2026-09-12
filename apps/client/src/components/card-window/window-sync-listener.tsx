import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { keys } from "@doska/core/keys"
import { isDesktop } from "@/lib/platform"
import { CHANGED_EVENT } from "@/components/quick-note/quick-note-event"

interface ChangedPayload {
  from: string
}

export function WindowSyncListener() {
  const qc = useQueryClient()

  useEffect(() => {
    if (!isDesktop()) return

    let cancelled = false
    const stops: (() => void)[] = []

    void Promise.all([
      import("@tauri-apps/api/event"),
      import("@tauri-apps/api/window"),
    ]).then(async ([{ listen, emit }, { getCurrentWindow }]) => {
      const win = getCurrentWindow()

      const stopChanged = await listen<ChangedPayload | null>(
        CHANGED_EVENT,
        ({ payload }) => {
          if (payload?.from === win.label) return
          qc.invalidateQueries({ queryKey: keys.boards })
          qc.invalidateQueries({ queryKey: keys.cards })
          qc.invalidateQueries({ queryKey: keys.cardCols })
          qc.invalidateQueries({ queryKey: keys.digest })
        }
      )

      const stopMutations = qc.getMutationCache().subscribe((event) => {
        if (event.type !== "updated" || event.action.type !== "success") return
        const payload: ChangedPayload = { from: win.label }
        void emit(CHANGED_EVENT, payload)
      })

      if (cancelled) {
        stopChanged()
        stopMutations()
      } else stops.push(stopChanged, stopMutations)
    })

    return () => {
      cancelled = true
      stops.forEach((stop) => stop())
    }
  }, [qc])

  return null
}
