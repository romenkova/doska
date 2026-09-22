import { useSetDashboardSort } from "@doska/core/mutations"
import type { Dashboard } from "@doska/core/types"
import { SORT_MODES, type SortKey } from "@doska/core/utils"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import type { LucideIcon } from "lucide-react-native"
import CalendarClock from "lucide-react-native/icons/calendar-clock"
import Check from "lucide-react-native/icons/check"
import Flag from "lucide-react-native/icons/flag"
import { Pressable, Text, View } from "react-native"

const ICONS: Record<SortKey, LucideIcon> = {
  priority: Flag,
  deadline: CalendarClock,
}

/** The web's sort menu as a sheet. Several modes can be on at once; they apply
 * in the order they were picked. */
export function BoardSort({ board }: { board: Dashboard }) {
  const tokens = useTokens()
  const { mutate: setSort } = useSetDashboardSort()
  const sort = board.sort ?? []

  function toggle(key: string) {
    const next = sort.includes(key)
      ? sort.filter((one) => one !== key)
      : [...sort, key]
    setSort({ id: board.id, sort: next })
  }

  return (
    <View>
      {SORT_MODES.map(({ id, label }) => {
        const selected = sort.includes(id)
        const Icon = ICONS[id]
        return (
          <Pressable
            key={id}
            onPress={() => toggle(id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className="flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-muted"
          >
            <Icon size={20} color={tokens.cardForeground} />
            <Text className="flex-1 text-[17px] font-sans text-card-foreground">
              Sort by {label.toLowerCase()}
            </Text>
            {selected ? <Check size={20} color={tokens.primary} /> : null}
          </Pressable>
        )
      })}
      <Text className="px-3 pt-2 text-[13px] font-sans text-muted-foreground">
        With none picked, cards stay in the order they were dragged into.
      </Text>
    </View>
  )
}
