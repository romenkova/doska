import { useCallback } from "react"
import { useSearchParams } from "wouter"

/** Query param that names the open modal, e.g. `?modal=settings`. */
const MODAL_PARAM = "modal"

/** Named modals, so triggers and hosts agree on the string without typos. */
export const modals = {
  settings: "settings",
  boardSettings: "board-settings",
  boardDelete: "board-delete",
} as const

export type ModalName = (typeof modals)[keyof typeof modals]

/**
 * Drives modals off a `?modal=<name>` query param instead of local state, so a
 * modal is deep-linkable, survives reload, and Back closes it. The param rides
 * on top of the current path — opening a modal over an open card keeps the card
 * — and any other query params are preserved.
 */
export function useModal() {
  const [params, setParams] = useSearchParams()
  const active = params.get(MODAL_PARAM)

  const open = useCallback(
    (name: ModalName) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set(MODAL_PARAM, name)
        return next
      })
    },
    [setParams]
  )

  const close = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete(MODAL_PARAM)
      return next
    })
  }, [setParams])

  return { active, open, close }
}
