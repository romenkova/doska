import { useDashboards } from "@doska/core"
import { useAuth } from "@/lib/hooks"
import { webKeyValue } from "@/lib/adapters/web-kv"

export const ONBOARDING_SEEN_KEY = "onboarding-seen"

/** Someone new on this device: signed out, at most one board, deck not seen. */
export function useShouldOnboard(): boolean | null {
  const { authed } = useAuth()
  const { data: boards } = useDashboards()

  if (authed === null || !boards) return null
  return !authed && boards.length <= 1 && !webKeyValue.get(ONBOARDING_SEEN_KEY)
}
