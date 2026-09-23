import type { SlashCommand } from "@doska/markdown"
import { Frosted } from "@doska/ui-kit-mobile"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import type { LucideIcon } from "lucide-react-native"
import Code from "lucide-react-native/icons/code"
import Eye from "lucide-react-native/icons/eye"
import Heading1 from "lucide-react-native/icons/heading-1"
import Heading2 from "lucide-react-native/icons/heading-2"
import Heading3 from "lucide-react-native/icons/heading-3"
import Link from "lucide-react-native/icons/link"
import ListChecks from "lucide-react-native/icons/list-checks"
import Minus from "lucide-react-native/icons/minus"
import Scissors from "lucide-react-native/icons/scissors"
import TextQuote from "lucide-react-native/icons/text-quote"
import type { ReactNode } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"

const ICON: Record<string, LucideIcon> = {
  todo: ListChecks,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  quote: TextQuote,
  code: Code,
  divider: Minus,
  cut: Scissors,
  link: Link,
}

const PILL_HEIGHT = 48
const ROW_PADDING = 8

/** What the bar covers, for the scroller it floats over to keep clear. */
export const TOOLBAR_HEIGHT = PILL_HEIGHT + ROW_PADDING * 2

// Notes' bar reads as a card floating over the note, which the shadow carries —
// the border is for dark mode, where the shadow disappears into the background.
const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
}

interface IProps {
  /** Commands to offer: the matches for a typed `/`, or the full list. */
  items: SlashCommand[]
  isPreview: boolean
  onPreview: () => void
  onSelect: (command: SlashCommand) => void
}

export function EditorToolbar({
  items,
  isPreview,
  onPreview,
  onSelect,
}: IProps) {
  const tokens = useTokens()

  if (isPreview) return null

  return (
    <View
      className="flex-row items-center justify-center gap-2 px-3"
      style={{ paddingVertical: ROW_PADDING }}
    >
      {items.length ? (
        <Pill grow>
          <ScrollView
            horizontal
            // A tap here must not be spent dismissing the keyboard.
            keyboardShouldPersistTaps="always"
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="items-center gap-1 px-1"
          >
            {items.map((command) => {
              const Glyph = ICON[command.id]
              return (
                <ToolButton
                  key={command.id}
                  label={command.title}
                  onPress={() => onSelect(command)}
                >
                  {Glyph ? (
                    <Glyph size={22} color={tokens.cardForeground} />
                  ) : (
                    <Text className="text-[13px] font-sans-medium text-card-foreground">
                      {command.title}
                    </Text>
                  )}
                </ToolButton>
              )
            })}
          </ScrollView>
        </Pill>
      ) : null}

      <Pill>
        <ToolButton label="Preview" onPress={onPreview}>
          <Eye size={22} color={tokens.cardForeground} />
        </ToolButton>
      </Pill>
    </View>
  )
}

/** One frosted capsule. `grow` gives it the row's spare width. */
function Pill({ grow, children }: { grow?: boolean; children: ReactNode }) {
  const tokens = useTokens()

  return (
    <View style={grow ? { ...SHADOW, flex: 1 } : SHADOW}>
      <Frosted
        style={{
          height: PILL_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.cardVeil,
          // Without this the blur ignores the radius and fills the corners.
          overflow: "hidden",
        }}
      >
        {children}
      </Frosted>
    </View>
  )
}

function ToolButton({
  label,
  onPress,
  children,
}: {
  label: string
  onPress: () => void
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="size-10 items-center justify-center rounded-full active:bg-secondary"
    >
      {children}
    </Pressable>
  )
}
