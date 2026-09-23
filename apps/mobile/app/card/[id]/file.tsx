import { apiUrl } from "@doska/core/server"
import { runtime } from "@doska/core/runtime"
import { Spinner } from "@doska/ui-kit-mobile"
import { Stack, useLocalSearchParams } from "expo-router"
import { WebView } from "react-native-webview"

export default function CardFileScreen() {
  const { key, name } = useLocalSearchParams<{ key: string; name: string }>()
  if (!key) return null

  const token = runtime().auth.token()

  return (
    <>
      <Stack.Screen options={{ title: name ?? "" }} />
      <WebView
        source={{
          uri: apiUrl(`/api/files/${encodeURIComponent(key)}`),
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        }}
        startInLoadingState
        renderLoading={() => <Spinner />}
      />
    </>
  )
}
