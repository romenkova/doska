import { PRIORITIES, PRIORITY } from "@doska/tokens/priority"
import Flag from "lucide-react-native/icons/flag"
import { useTokens } from "./tokens"

/** The web's `/80` on the flag colour. */
const DIMMED = "cc"

interface IProps {
  value: string
  size?: number
}

/** The priority badge: a filled flag, coloured by level. Unset shows an
 * outline, for pickers that list "No priority". */
export function PriorityChip({ value, size = 16 }: IProps) {
  const { destructive, mutedForeground, dark } = useTokens()
  const priority = PRIORITIES.find((p) => p.id === value)

  const colors: Record<string, string> = {
    high: destructive + DIMMED,
    medium: PRIORITY[dark ? "dark" : "light"].medium + DIMMED,
  }
  const color = (priority && colors[priority.id]) ?? mutedForeground

  return (
    <Flag
      size={size}
      color={color}
      fill={priority ? color : "transparent"}
      strokeWidth={priority ? 1 : 2}
      accessibilityLabel={priority ? `Priority: ${priority.label}` : undefined}
    />
  )
}
