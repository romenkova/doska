import { useRoute } from "wouter"
import { routes } from "@/lib/routes"

export function useIsMainWindow(): boolean {
  const [isSignIn] = useRoute(routes.signIn())
  const [isQuickNote] = useRoute(routes.quickNote())
  const [isCardWindow] = useRoute(routes.cardWindow.pattern)
  return !isSignIn && !isQuickNote && !isCardWindow
}
