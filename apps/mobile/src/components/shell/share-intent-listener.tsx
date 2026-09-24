import { router, useRootNavigationState } from "expo-router"
import { useShareIntentContext } from "expo-share-intent"
import { useEffect } from "react"
import { ROUTES } from "@/lib/routes"

/** Opens the share sheet whenever another app shares into Doska. */
export function ShareIntentListener() {
  const { hasShareIntent } = useShareIntentContext()
  const isNavigationReady = Boolean(useRootNavigationState()?.key)

  useEffect(() => {
    if (hasShareIntent && isNavigationReady) router.push(ROUTES.share)
  }, [hasShareIntent, isNavigationReady])

  return null
}
