import type { Card } from "@doska/core/types"
import { IconButton } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import MoreHorizontal from "lucide-react-native/icons/ellipsis"
import { ROUTES } from "@/lib/routes"

export function CardActionsButton({ card }: { card: Card }) {
  return (
    <IconButton
      icon={MoreHorizontal}
      label={`${card.title || "Untitled card"} actions`}
      variant="plain"
      size={18}
      onPress={() => router.push(ROUTES.cardActions(card.id))}
    />
  )
}
