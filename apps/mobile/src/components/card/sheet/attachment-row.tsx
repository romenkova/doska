import { cn } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import Paperclip from "lucide-react-native/icons/paperclip"
import { ActivityIndicator, Pressable, Text } from "react-native"

interface IProps {
  name: string
  isPending?: boolean
  onPress?: () => void
  onLongPress?: () => void
}

export function AttachmentRow({
  name,
  isPending,
  onPress,
  onLongPress,
}: IProps) {
  const tokens = useTokens()

  return (
    <Pressable
      disabled={isPending}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      className={cn(
        "flex-row items-center gap-1 py-1.5",
        isPending && "opacity-60"
      )}
    >
      {isPending ? (
        <ActivityIndicator size="small" />
      ) : (
        <Paperclip size={14} color={tokens.mutedForeground} />
      )}
      <Text
        numberOfLines={1}
        className="flex-1 text-sm font-sans text-muted-foreground"
      >
        {name}
      </Text>
    </Pressable>
  )
}
