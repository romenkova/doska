import { useTokens } from "@doska/ui-kit-mobile/tokens"
import Hash from "lucide-react-native/icons/hash"
import { Text, View } from "react-native"

/** The web's `/10` on the chip's primary fill and border. */
const TINT = "1a"

interface IProps {
  tags: string[]
}

/** Mirrors the web's `TagChip`, minus the tap-to-filter: mobile has no tag search. */
export function CardTags({ tags }: IProps) {
  const { primary } = useTokens()

  return (
    <View className="flex-row flex-wrap gap-1">
      {tags.map((tag) => (
        <View
          key={tag}
          className="flex-row items-center gap-0.5 rounded-lg border px-1.5 py-px"
          style={{ backgroundColor: primary + TINT, borderColor: primary + TINT }}
        >
          <Hash size={14} strokeWidth={2.5} color={primary} />
          <Text
            numberOfLines={1}
            className="text-[13px] leading-[18px] text-card-foreground"
          >
            {tag}
          </Text>
        </View>
      ))}
    </View>
  )
}
