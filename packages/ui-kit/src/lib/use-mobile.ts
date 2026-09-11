import { createContext, useContext, useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

const MobileOverrideCtx = createContext<boolean | null>(null)

/** popout window. */
export const MobileOverride = MobileOverrideCtx.Provider

export function useIsMobile() {
  const override = useContext(MobileOverrideCtx)
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return override ?? isMobile
}
