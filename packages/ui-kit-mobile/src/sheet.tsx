import type { LucideIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTokens } from "./tokens"

/**
 * The content of a sheet route. The sheet itself — its height, its grabber, its
 * dismiss gesture, its scrim — is the native form sheet configured on the route
 * in `app/_layout.tsx`; this only pads what sits inside it.
 *
 * Must not stretch: the route's detent is `fitToContents`, which measures this.
 */
export function SheetScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{ paddingBottom: insets.bottom + 12 }}
      className="bg-card px-4 pt-4"
    >
      {children}
    </View>
  )
}

interface IBarAction {
  label: string
  onPress: () => void
}

/**
 * A sheet's navigation bar, laid out the way iOS lays one out: the dismissing
 * action leading, the confirming action trailing and emphasised, the title
 * centred on the bar itself rather than on the space between the two — so it
 * stays put as the labels change width.
 */
export function SheetBar({
  title,
  leading,
  trailing,
}: {
  title?: string
  leading?: IBarAction
  trailing?: IBarAction
}) {
  return (
    <View className="h-11 flex-row items-center justify-between">
      {title ? (
        <Text
          numberOfLines={1}
          pointerEvents="none"
          className="absolute inset-x-0 text-center text-[17px] font-sans-semibold text-card-foreground"
        >
          {title}
        </Text>
      ) : null}
      <BarButton action={leading} />
      <BarButton action={trailing} emphasised />
    </View>
  )
}

function BarButton({
  action,
  emphasised,
}: {
  action?: IBarAction
  emphasised?: boolean
}) {
  // Holds the bar's ends apart so the centred title stays centred.
  if (!action) return <View className="w-16" />

  return (
    <Pressable hitSlop={8} onPress={action.onPress} className="min-w-16">
      <Text
        className={
          emphasised
            ? "text-right text-[17px] font-sans-semibold text-primary"
            : "text-[17px] font-sans text-primary"
        }
      >
        {action.label}
      </Text>
    </Pressable>
  )
}

interface IItemProps {
  icon: LucideIcon
  label: string
  /** Right-aligned hint, the way the web menu shows the current prefix. */
  trailing?: string
  disabled?: boolean
  destructive?: boolean
  onPress: () => void
}

export function SheetItem({
  icon: Icon,
  label,
  trailing,
  disabled,
  destructive,
  onPress,
}: IItemProps) {
  const tokens = useTokens()
  const color = destructive ? tokens.destructive : tokens.cardForeground

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={
        disabled
          ? "flex-row items-center gap-3 rounded-xl px-3 py-3.5 opacity-40"
          : "flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
      }
    >
      <Icon size={20} color={color} />
      {/* 17pt: the body size iOS sets every list row and menu item in. */}
      <Text style={{ color }} className="flex-1 text-[17px] font-sans">
        {label}
      </Text>
      {trailing ? (
        <Text className="font-mono text-[13px] text-muted-foreground">
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  )
}

const ACTION_LABEL = {
  default: "text-[17px] font-sans text-primary",
  cancel: "text-[17px] font-sans-semibold text-primary",
  destructive: "text-[17px] font-sans text-destructive",
}

/**
 * One row of an action sheet: full width, its own group, the label centred and
 * coloured by role. iOS never pairs a confirm and a cancel side by side — they
 * stack, destructive first and cancel last, set apart in a group of its own.
 */
export function SheetAction({
  label,
  role = "default",
  onPress,
}: {
  label: string
  role?: keyof typeof ACTION_LABEL
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center rounded-2xl bg-button-muted px-4 py-3.5 active:bg-muted"
    >
      <Text className={ACTION_LABEL[role]}>{label}</Text>
    </Pressable>
  )
}
