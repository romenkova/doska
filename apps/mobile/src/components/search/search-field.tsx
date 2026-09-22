import { IconButton, TextField } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import SearchIcon from "lucide-react-native/icons/search"
import X from "lucide-react-native/icons/x"
import { Platform, Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface IProps {
  value: string
  onChangeText: (value: string) => void
  onCancel: () => void
}

export function SearchField({ value, onChangeText, onCancel }: IProps) {
  const insets = useSafeAreaInsets()
  const tokens = useTokens()

  return (
    <View
      // The iOS modal starts below the status bar already; Android's covers it.
      style={{ paddingTop: Platform.OS === "android" ? insets.top : 0 }}
      className="shrink-0 border-b border-sidebar-border bg-sidebar"
    >
      <View className="flex-row items-center justify-between px-4 pb-1 pt-4">
        <Text className="text-[22px] font-sans-bold text-sidebar-foreground">
          Search
        </Text>
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          accessibilityRole="button"
          className="active:opacity-40"
        >
          <Text className="text-[17px] font-sans-medium text-primary">
            Cancel
          </Text>
        </Pressable>
      </View>

      <View className="mx-4 mb-3 mt-2 flex-row items-center gap-2 rounded-xl bg-secondary px-2.5">
        <SearchIcon size={16} color={tokens.mutedForeground} />
        <TextField
          value={value}
          onChangeText={onChangeText}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          returnKeyType="search"
          accessibilityLabel="Search cards"
          className="min-w-0 flex-1 py-2.5 text-[16px] text-foreground"
        />
        {value !== "" && (
          <IconButton
            icon={X}
            variant="plain"
            size={16}
            label="Clear search"
            onPress={() => onChangeText("")}
          />
        )}
      </View>
    </View>
  )
}
