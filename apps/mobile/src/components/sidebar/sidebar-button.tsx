import { useTokens } from "@doska/ui-kit-mobile/tokens"
import type { LucideIcon } from "lucide-react-native"
import { Pressable, Text, View } from "react-native"

const ROW = {
  pressable: {
    on: "flex-row items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-2 active:bg-sidebar-accent",
    off: "flex-row items-center gap-2 rounded-lg px-2 py-2 active:bg-muted",
  },
  plain: {
    on: "flex-row items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-2",
    off: "flex-row items-center gap-2 rounded-lg px-2 py-2",
  },
}

interface IProps {
  icon?: LucideIcon
  label: string
  isActive?: boolean
  /** Omit inside a `Sortable.Touchable`, which takes the tap instead. */
  onPress?: () => void
}

/** One row in the sidebar — the web's `SidebarMenuButton`. */
export function SidebarButton({
  icon: Icon,
  label,
  isActive,
  onPress,
}: IProps) {
  const tokens = useTokens()
  const Row = onPress ? Pressable : View

  return (
    <Row
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      // `active:` must be on every render or none: NativeWind swaps a View for
      // a Pressable when it appears later, and the remount crashes navigation.
      className={ROW[onPress ? "pressable" : "plain"][isActive ? "on" : "off"]}
    >
      {Icon ? (
        <Icon
          size={16}
          color={isActive ? tokens.primary : tokens.mutedForeground}
        />
      ) : null}
      <Text
        numberOfLines={1}
        className={
          isActive
            ? "flex-1 text-sm font-sans-medium text-sidebar-accent-foreground"
            : "flex-1 text-sm font-sans text-sidebar-foreground"
        }
      >
        {label}
      </Text>
    </Row>
  )
}
