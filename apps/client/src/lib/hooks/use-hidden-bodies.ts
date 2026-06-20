import { useCallback, useState } from "react"

/**
 * Per-column toggle for collapsing card bodies down to their titles. Defaults to
 * shown; state is keyed by column id and lives only for the session.
 */
export function useHiddenBodies() {
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const showBody = useCallback((columnId: string) => !hidden[columnId], [hidden])

  const toggleBody = useCallback((columnId: string) => {
    setHidden((h) => ({ ...h, [columnId]: !h[columnId] }))
  }, [])

  return { showBody, toggleBody }
}
