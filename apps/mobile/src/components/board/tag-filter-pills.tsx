import { useTokens } from "@doska/ui-kit-mobile/tokens"
import X from "lucide-react-native/icons/x"
import { Pressable, View } from "react-native"
import { TagChip } from "@/components/card/tag-chip"

interface IProps {
  tags: string[]
  onPressTag: (tag: string) => void
}

/** The strip under the board header listing the active tag filters. */
export function TagFilterPills({ tags, onPressTag }: IProps) {
  const { mutedForeground } = useTokens()
  if (tags.length === 0) return null

  return (
    <View className="flex-row flex-wrap items-center gap-2 border-b border-muted px-4 py-1.5">
      {tags.map((tag) => (
        <Pressable
          key={tag}
          onPress={() => onPressTag(tag)}
          accessibilityRole="button"
          accessibilityLabel={`Clear #${tag} filter`}
          hitSlop={4}
          className="active:opacity-60"
        >
          <TagChip label={tag}>
            <X size={12} color={mutedForeground} style={{ marginLeft: 2 }} />
          </TagChip>
        </Pressable>
      ))}
    </View>
  )
}
