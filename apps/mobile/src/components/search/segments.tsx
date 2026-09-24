import type { Segment } from "@doska/core/search"
import { Text } from "react-native"

/** Matched runs in weight only, as on the web. */
export function Segments({ segments }: { segments: Segment[] }) {
  return segments.map((run, index) => (
    <Text key={index} className={run.hit ? "font-sans-semibold" : undefined}>
      {run.text}
    </Text>
  ))
}
