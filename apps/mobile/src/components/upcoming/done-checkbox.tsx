import { useTokens } from "@doska/ui-kit-mobile/tokens"
import * as Haptics from "expo-haptics"
import Check from "lucide-react-native/icons/check"
import { Pressable, View } from "react-native"

const BOX = {
  checked:
    "size-5 items-center justify-center rounded-[5px] border border-primary bg-primary",
  open: "size-5 items-center justify-center rounded-[5px] border border-input",
  // No done column to send it to: dashed, and a tap explains why.
  stuck:
    "size-5 items-center justify-center rounded-[5px] border border-dashed border-input",
}

interface IProps {
  checked: boolean
  stuck: boolean
  onPress: () => void
}

export function DoneCheckbox({ checked, stuck, onPress }: IProps) {
  const tokens = useTokens()

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={10}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
    >
      <View className={BOX[checked ? "checked" : stuck ? "stuck" : "open"]}>
        {checked ? (
          <Check size={14} strokeWidth={3} color={tokens.primaryForeground} />
        ) : null}
      </View>
    </Pressable>
  )
}
