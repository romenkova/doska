import { useIsMainWindow } from "@/lib/hooks"
import { OnboardingDeck } from "./onboarding-deck"
import { useShouldOnboard } from "./use-should-onboard"

export function OnboardingModal() {
  const isMainWindow = useIsMainWindow()
  const shouldOnboard = useShouldOnboard()

  if (!isMainWindow || shouldOnboard === null) return null

  return <OnboardingDeck shouldShow={shouldOnboard} />
}
