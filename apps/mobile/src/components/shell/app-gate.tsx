import { bootstrapClient } from "@doska/core"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { type ReactNode, useEffect, useState } from "react"
import { Text, View } from "react-native"
import { FONTS } from "@/lib/fonts"

SplashScreen.preventAutoHideAsync()

interface IProps {
  children: ReactNode
}

/** Holds the app back until the database and the fonts are ready, and shows
 * why if the database never comes up. */
export function AppGate({ children }: IProps) {
  const [ready, setReady] = useState(false)
  const [failure, setFailure] = useState<Error | null>(null)
  const [fontsLoaded] = useFonts(FONTS)
  const settled = failure !== null || (ready && fontsLoaded)

  useEffect(() => {
    bootstrapClient().then(
      () => setReady(true),
      (error: Error) => setFailure(error)
    )
  }, [])

  // Runs after the frame that renders the children, so nothing blank shows.
  useEffect(() => {
    if (settled) SplashScreen.hideAsync()
  }, [settled])

  if (failure) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="p-6 text-center font-sans text-destructive">
          {failure.message}
        </Text>
      </View>
    )
  }

  // The native splash is still up here, so there is nothing to render.
  if (!settled) return null

  return <>{children}</>
}
