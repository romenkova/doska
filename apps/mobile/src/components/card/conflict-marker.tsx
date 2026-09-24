import { DEADLINE } from "@doska/tokens/deadline"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import TriangleAlert from "lucide-react-native/icons/triangle-alert"

export function ConflictMarker() {
  const { dark } = useTokens()

  return (
    <TriangleAlert
      size={16}
      color={DEADLINE[dark ? "dark" : "light"].soonForeground}
      accessibilityLabel="Edit conflict"
    />
  )
}
