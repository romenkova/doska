import { useTokens } from "@doska/ui-kit-mobile"
import { Drawer } from "expo-router/drawer"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SCREENS } from "@/lib/routes"

export default function DrawerLayout() {
  const tokens = useTokens()

  return (
    <Drawer
      drawerContent={(props) => <AppSidebar navigation={props.navigation} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { backgroundColor: tokens.sidebar, width: 280 },
        swipeEdgeWidth: 40,
        sceneStyle: { backgroundColor: tokens.sidebar },
      }}
    >
      <Drawer.Screen name={SCREENS.board} options={{ title: "Board" }} />
      <Drawer.Screen name={SCREENS.upcoming} options={{ title: "Upcoming" }} />
      <Drawer.Screen name={SCREENS.trash} options={{ title: "Trash" }} />
    </Drawer>
  )
}
