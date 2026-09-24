import { Pressable, View } from "react-native"
import { TagChip } from "./tag-chip"

interface IProps {
  tags: string[]
  onPressTag: (tag: string) => void
}

export function CardTags({ tags, onPressTag }: IProps) {
  return (
    <View className="flex-row flex-wrap gap-1">
      {tags.map((tag) => (
        <Pressable
          key={tag}
          onPress={() => onPressTag(tag)}
          accessibilityRole="button"
          accessibilityLabel={`Show cards tagged #${tag}`}
          hitSlop={4}
          className="active:opacity-60"
        >
          <TagChip label={tag} />
        </Pressable>
      ))}
    </View>
  )
}
