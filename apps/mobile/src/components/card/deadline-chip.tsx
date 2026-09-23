import {
  deadlineRelative,
  deadlineStatus,
  formatDeadlineShort,
} from "@doska/core/utils"
import { DEADLINE } from "@doska/tokens/deadline"
import { useTokens } from "@doska/ui-kit-mobile/tokens"
import Calendar from "lucide-react-native/icons/calendar"
import { Text, View } from "react-native"

/** The web's `/80` on the overdue and soon colours. */
const DIMMED = "cc"

interface IProps {
  /** No deadline still renders: the bare calendar is how one gets set. */
  value: string | null
  /** The card sits in the board's done column. */
  done: boolean
}

export function DeadlineChip({ value, done }: IProps) {
  const { destructive, mutedForeground, dark } = useTokens()

  // A done card is neutral whatever its deadline: no red, plain date.
  const status = done || !value ? "upcoming" : deadlineStatus(value)
  const label =
    value === null
      ? null
      : status === "upcoming"
        ? formatDeadlineShort(value)
        : deadlineRelative(value)
  const color =
    status === "overdue"
      ? destructive + DIMMED
      : status === "soon"
        ? DEADLINE[dark ? "dark" : "light"].soonForeground + DIMMED
        : mutedForeground

  return (
    <View className="flex-row items-center gap-1">
      <Calendar size={16} color={color} />
      {label !== null && (
        <Text
          className="text-sm font-sans-semibold tabular-nums"
          style={{ color }}
        >
          {label}
        </Text>
      )}
    </View>
  )
}
