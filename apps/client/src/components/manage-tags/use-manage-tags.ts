import { useCallback } from "react"
import { useSearchParams } from "wouter"

const PARAM = "tags"

/** A query param rather than a path, so an open card stays open underneath. */
export function useManageTags() {
  const [params, setParams] = useSearchParams()

  const open = useCallback(
    (boardId: string) =>
      setParams((prev) => {
        prev.set(PARAM, boardId)
        return prev
      }),
    [setParams]
  )
  const close = useCallback(
    () =>
      setParams((prev) => {
        prev.delete(PARAM)
        return prev
      }),
    [setParams]
  )

  return { boardId: params.get(PARAM), open, close }
}
