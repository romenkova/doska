import { useCreateDashboard } from "@doska/core/mutations"
import { Button } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { DrawerActions } from "@react-navigation/native"
import Constants from "expo-constants"
import { router, usePathname } from "expo-router"
import type { DrawerContentComponentProps } from "expo-router/drawer"
import Anchor from "lucide-react-native/icons/anchor"
import CalendarClock from "lucide-react-native/icons/calendar-clock"
import Plus from "lucide-react-native/icons/plus"
import Trash2 from "lucide-react-native/icons/trash-2"
import { ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ROUTES } from "@/lib/routes"
import { setLastBoard } from "@doska/core/last-board"
import { useActiveBoard } from "@/lib/use-active-board"
import { DashboardsList } from "./dashboards-list"
import { DocsButton } from "./docs-button"
import { GitHubButton } from "./github-button"
import { SidebarAccount } from "./sidebar-account"
import { SidebarButton } from "./sidebar-button"
import { ThemeToggle } from "./theme-toggle"

/** `navigation` comes from the drawer's own `drawerContent` props: the sidebar
 * renders in the parent navigator's context, so a `useNavigation()` here would
 * dispatch `CLOSE_DRAWER` upwards, where no drawer handles it. */
export function AppSidebar({
  navigation,
}: {
  navigation: DrawerContentComponentProps["navigation"]
}) {
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const tokens = useTokens()
  const { deckId } = useActiveBoard()
  const { mutate: createDashboard } = useCreateDashboard()

  // Navigating from inside the drawer does not dismiss it; the drawer is its own
  // navigator and the route change happens underneath it.
  function go(href: (typeof ROUTES)["board" | "upcoming" | "trash"]) {
    router.navigate(href)
    navigation.dispatch(DrawerActions.closeDrawer())
  }

  function openBoard(id: string) {
    setLastBoard(id)
    go(ROUTES.board)
  }

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 bg-sidebar"
    >
      <View className="flex-row items-center gap-2 px-4 py-3">
        <Anchor size={16} color={tokens.foreground} />
        <Text className="text-base font-sans-semibold text-sidebar-foreground">
          Doska
        </Text>
        <Text className="text-[13px] text-muted-foreground opacity-50">
          {Constants.expoConfig?.version ?? ""}
        </Text>
      </View>

      <ScrollView contentContainerClassName="pb-4">
        <View className="px-4 pb-2">
          <Button
            variant="secondary"
            icon={Plus}
            label="Add a dashboard"
            onPress={() =>
              createDashboard("Untitled board", {
                onSuccess: (created) => openBoard(created.id),
              })
            }
          />
        </View>

        <View className="gap-0.5 px-2">
          <SidebarButton
            icon={CalendarClock}
            label="Upcoming"
            isActive={pathname === ROUTES.upcoming}
            onPress={() => go(ROUTES.upcoming)}
          />
          <SidebarButton
            icon={Trash2}
            label="Trash"
            isActive={pathname === ROUTES.trash}
            onPress={() => go(ROUTES.trash)}
          />
        </View>

        <DashboardsList
          activeDashboardId={pathname === ROUTES.board ? deckId : null}
          onSelectDashboard={(dashboard) => openBoard(dashboard.id)}
        />
      </ScrollView>

      <View className="gap-0.5 border-t border-sidebar-border px-2 pt-2">
        <ThemeToggle />
        <DocsButton />
        <GitHubButton />
        <SidebarAccount />
      </View>
    </View>
  )
}
