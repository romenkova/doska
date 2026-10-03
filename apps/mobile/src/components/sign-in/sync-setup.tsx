import {
  useLogin,
  UNCLAIMED_BOARDS_WARNING,
  useUnclaimedLocalBoards,
  getServerUrl,
  setServerUrl,
} from "@doska/core"
import { Button, Input } from "@doska/ui-kit-mobile"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Text, View } from "react-native"

export function SyncSetup() {
  const router = useRouter()
  const [server, setServer] = useState(getServerUrl)
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, isError } = useLogin()
  const { data: unclaimedBoards } = useUnclaimedLocalBoards()

  function submit() {
    // There is no same-origin server to fall back on, so the URL has to be
    // stored before signing in — that is what tells the auth call where to go.
    setServerUrl(server)
    mutate(
      { login, password },
      {
        onSuccess: () => {
          setPassword("")
          router.back()
        },
      }
    )
  }

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-xl font-sans-semibold text-card-foreground">
          Set up sync
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Your boards stay on this device until you set up sync.
        </Text>
        {unclaimedBoards && (
          <Text className="text-[13px] text-muted-foreground">
            {UNCLAIMED_BOARDS_WARNING}
          </Text>
        )}
      </View>

      <View className="gap-2">
        <Input
          value={server}
          onChangeText={setServer}
          placeholder="Server URL (https://…)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
        />
        <Input
          value={login}
          onChangeText={setLogin}
          placeholder="Login"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          textContentType="password"
          onSubmitEditing={submit}
        />
        {isError && (
          <Text className="text-xs text-destructive">Invalid credentials.</Text>
        )}
      </View>

      <Button
        label={isPending ? "Signing in..." : "Sign in"}
        disabled={isPending || !server.trim() || !login || !password}
        onPress={submit}
      />
    </View>
  )
}
