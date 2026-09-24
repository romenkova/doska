import { sync, useConnection } from "@doska/core/sync"
import { Button, IconButton } from "@doska/ui-kit-mobile"
import X from "lucide-react-native/icons/x"
import { useState } from "react"
import { Text, View } from "react-native"

/**
 * Persistent notice for a dropped sync connection, the mobile form of the
 * web's `OfflineToast`. A banner under the header, since there is no toaster
 * here yet.
 */
export function OfflineBanner() {
  const connection = useConnection()
  const dropped = connection.status === "dropped"
  const [dismissed, setDismissed] = useState(false)

  // A new drop is worth showing again, however the last one was closed.
  const [wasDropped, setWasDropped] = useState(dropped)
  if (wasDropped !== dropped) {
    setWasDropped(dropped)
    setDismissed(false)
  }

  if (!dropped || dismissed) return null

  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-center gap-3 border-t border-sidebar-border bg-popover px-3 py-2"
    >
      <View className="flex-1">
        <Text className="text-[13px] font-sans-medium text-popover-foreground">
          Not syncing
        </Text>
        <Text className="text-xs text-muted-foreground">
          Can not connect to server. You might be offline, or unauthenticated.
          Data is saved on this device.
        </Text>
      </View>
      <Button
        label="Retry"
        size="sm"
        variant="secondary"
        onPress={() => void sync.reconcile()}
      />
      <IconButton
        icon={X}
        label="Dismiss"
        size={16}
        onPress={() => setDismissed(true)}
      />
    </View>
  )
}
