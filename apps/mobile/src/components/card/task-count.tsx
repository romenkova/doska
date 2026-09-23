import { useTokens } from "@doska/ui-kit-mobile/tokens"
import { Text, View } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"

const VIEWBOX = 16
const STROKE = 2
const RADIUS = (VIEWBOX - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = VIEWBOX / 2

interface IProps {
  done: number
  total: number
}

/** Mirrors the web's `TaskIndicator`: a progress ring, ticked when complete. */
export function TaskCount({ done, total }: IProps) {
  const { mutedForeground } = useTokens()
  const complete = total > 0 && done === total
  const progress = total === 0 ? 0 : done / total

  return (
    <View className="flex-row items-center gap-1">
      <Svg width={16} height={16} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={mutedForeground}
          strokeWidth={STROKE}
          opacity={0.3}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={mutedForeground}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          // Starts the arc at 12 o'clock instead of 3.
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        {complete && (
          <Path
            d="M4.8 8.2 L7 10.4 L11.2 6"
            fill="none"
            stroke={mutedForeground}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
      <Text className="mt-px font-mono text-sm tabular-nums text-muted-foreground">
        {done}/{total}
      </Text>
    </View>
  )
}
