import { useAccount } from "@doska/core/account"
import { initials } from "@doska/core/utils"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import ChevronRight from "lucide-react-native/icons/chevron-right"
import UserRound from "lucide-react-native/icons/user-round"
import { Pressable, Text, View } from "react-native"
import { ROUTES } from "@/lib/routes"

/** What sync is doing, and a tap to fix it — the sign-in screen handles both
 * signing in and signing out. */
export function SidebarAccount() {
  const { session, name, subtitle, dropped } = useAccount()
  const tokens = useTokens()

  return (
    <Pressable
      onPress={() => router.push(ROUTES.signIn)}
      className="flex-row items-center gap-2 rounded-lg px-2 py-2 active:bg-muted"
    >
      <View className="size-8 items-center justify-center rounded-full bg-muted">
        {session?.authed && session.login ? (
          <Text className="text-xs font-sans-semibold text-muted-foreground">
            {initials(session.login)}
          </Text>
        ) : (
          <UserRound size={16} color={tokens.mutedForeground} />
        )}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-[13px] font-sans-medium text-sidebar-foreground"
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          className={
            dropped
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={16} color={tokens.mutedForeground} />
    </Pressable>
  )
}
