import "../global.css"

import { queryClient } from "@doska/core/query-client"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AppGate } from "@/components/shell/app-gate"
import { FONT } from "@/lib/fonts"
import { SCREENS } from "@/lib/routes"
import { restoreTheme } from "@/lib/theme"

// Before the first render, so a chosen theme never flashes the device's one.
restoreTheme()

export default function RootLayout() {
  const tokens = useTokens()

  const sheetOptions = {
    headerShown: false,
    presentation: "formSheet",
    sheetAllowedDetents: "fitToContents",
    sheetGrabberVisible: true,
    sheetCornerRadius: 24,
    sheetExpandsWhenScrolledToEdge: false,
    contentStyle: { backgroundColor: tokens.background },
  } as const

  const headerOptions = {
    headerStyle: { backgroundColor: tokens.card },
    headerTitleStyle: {
      color: tokens.foreground,
      fontFamily: FONT.sansSemibold,
    },
    headerTintColor: tokens.primary,
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppGate>
          <StatusBar style={tokens.dark ? "light" : "dark"} />
          <Stack screenOptions={headerOptions}>
            <Stack.Screen
              name={SCREENS.drawer}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name={SCREENS.card}
              options={{
                ...sheetOptions,
                sheetAllowedDetents: [1],
                contentStyle: { backgroundColor: tokens.card },
              }}
            />
            <Stack.Screen name={SCREENS.cardActions} options={sheetOptions} />
            <Stack.Screen name={SCREENS.cardDeadline} options={sheetOptions} />
            <Stack.Screen name={SCREENS.cardPriority} options={sheetOptions} />
            <Stack.Screen name={SCREENS.cardMove} options={sheetOptions} />
            <Stack.Screen name={SCREENS.cardBoard} options={sheetOptions} />
            <Stack.Screen name={SCREENS.cardDelete} options={sheetOptions} />
            <Stack.Screen name={SCREENS.boardActions} options={sheetOptions} />
            <Stack.Screen name={SCREENS.boardReorder} options={sheetOptions} />
            <Stack.Screen name={SCREENS.boardDelete} options={sheetOptions} />
            <Stack.Screen name={SCREENS.boardFolder} options={sheetOptions} />
            <Stack.Screen name={SCREENS.boardSort} options={sheetOptions} />
            <Stack.Screen
              name={SCREENS.boardDoneColumn}
              options={sheetOptions}
            />
            <Stack.Screen name={SCREENS.folderNew} options={sheetOptions} />
            <Stack.Screen name={SCREENS.folderActions} options={sheetOptions} />
            <Stack.Screen name={SCREENS.folderRename} options={sheetOptions} />
            <Stack.Screen name={SCREENS.columnNew} options={sheetOptions} />
            <Stack.Screen name={SCREENS.columnActions} options={sheetOptions} />
            <Stack.Screen name={SCREENS.columnDelete} options={sheetOptions} />
            <Stack.Screen
              name={SCREENS.search}
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name={SCREENS.signIn}
              options={{ title: "Sync", presentation: "modal" }}
            />
          </Stack>
        </AppGate>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
