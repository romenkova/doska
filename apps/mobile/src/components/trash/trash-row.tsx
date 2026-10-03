import { expiryLabel, type TrashEntry, type TrashKind } from "@doska/core"
import { Button, useTokens } from "@doska/ui-kit-mobile"
import Columns3 from "lucide-react-native/icons/columns-3"
import LayoutDashboard from "lucide-react-native/icons/layout-dashboard"
import StickyNote from "lucide-react-native/icons/sticky-note"
import { Text, View } from "react-native"

const ICONS: Record<TrashKind, typeof StickyNote> = {
  cards: StickyNote,
  columns: Columns3,
  dashboards: LayoutDashboard,
}

interface IProps {
  entry: TrashEntry
  isRestoring: boolean
  onRestore: () => void
}

export function TrashRow({ entry, isRestoring, onRestore }: IProps) {
  const Icon = ICONS[entry.kind]
  const tokens = useTokens()

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <Icon size={16} color={tokens.mutedForeground} />
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-sans-medium text-card-foreground"
        >
          {entry.title || "Untitled"}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {entry.context}
          {entry.cardCount > 0
            ? ` · ${entry.cardCount} ${entry.cardCount === 1 ? "card" : "cards"}`
            : ""}
          {` · ${expiryLabel(entry.expiresAt)}`}
        </Text>
      </View>
      <Button
        variant="secondary"
        size="sm"
        label="Restore"
        disabled={isRestoring}
        onPress={onRestore}
      />
    </View>
  )
}
