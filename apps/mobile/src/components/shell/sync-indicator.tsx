import { useAccount } from "@doska/core/account"
import {
  sync,
  useConnection,
  type Connection,
  type SyncState,
} from "@doska/core/sync"
import { cn } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { router } from "expo-router"
import type { LucideIcon } from "lucide-react-native"
import Check from "lucide-react-native/icons/check"
import CloudOff from "lucide-react-native/icons/cloud-off"
import LogIn from "lucide-react-native/icons/log-in"
import PencilLine from "lucide-react-native/icons/pencil-line"
import TriangleAlert from "lucide-react-native/icons/triangle-alert"
import { useSyncExternalStore } from "react"
import { ActivityIndicator, Pressable, Text } from "react-native"
import { ROUTES } from "@/lib/routes"

interface Look {
  Icon: LucideIcon | null
  label: string
  danger: boolean
}

function view({ status, pending }: SyncState, connection: Connection): Look {
  if (connection.status === "dropped")
    return connection.reason === "offline"
      ? { Icon: CloudOff, label: "Offline", danger: true }
      : { Icon: TriangleAlert, label: "Sync failed", danger: true }

  if (status === "syncing")
    return { Icon: null, label: "Syncing", danger: false }
  if (status === "error")
    return { Icon: TriangleAlert, label: "Sync failed", danger: true }
  if (pending > 0)
    return {
      Icon: PencilLine,
      label: `${pending} ${pending === 1 ? "change" : "changes"}`,
      danger: false,
    }
  return { Icon: Check, label: "Synced", danger: false }
}

const WIDTH = 100

const BOX =
  "flex-row items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 active:opacity-70"

const LABEL_CLASS = "font-sans-medium text-[13px] text-muted-foreground"

export function SyncIndicator() {
  const state = useSyncExternalStore(sync.subscribe, sync.getState)
  const connection = useConnection()
  const { authed, pending: sessionPending } = useAccount()
  const tokens = useTokens()

  // Signed out, sync can't run, so point at the sign-in screen rather than show a
  // misleading "sync failed". The pre-check state counts as signed in, to avoid
  // a flash on every launch.
  if (!authed && !sessionPending) {
    return (
      <Pressable
        onPress={() => router.push(ROUTES.signIn)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Sign in to sync"
        style={{ width: WIDTH }}
        className={BOX}
      >
        <Text className={LABEL_CLASS}>Sign in</Text>
        <LogIn size={14} color={tokens.mutedForeground} />
      </Pressable>
    )
  }

  const { Icon, label, danger } = view(state, connection)
  const color = danger ? tokens.destructive : tokens.mutedForeground

  return (
    <Pressable
      onPress={() => void sync.reconcile()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: WIDTH }}
      className={BOX}
    >
      {Icon ? (
        <Icon size={14} color={color} />
      ) : (
        <ActivityIndicator size="small" color={color} />
      )}
      <Text
        numberOfLines={1}
        className={cn(LABEL_CLASS, danger && "text-destructive")}
      >
        {label}
      </Text>
    </Pressable>
  )
}
