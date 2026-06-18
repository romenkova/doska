import { useCallback, useState } from "react"

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)

  const toggle = useCallback((next?: boolean | unknown) => {
    setValue((prev) => (typeof next === "boolean" ? next : !prev))
  }, [])

  return [value, toggle] as const
}
