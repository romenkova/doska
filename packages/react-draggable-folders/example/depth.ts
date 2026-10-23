import type { DepthLimits } from "../src"

export const LIMITS = {
  "∞": undefined,
  "0": { item: 1, folder: 0 },
  "1": { item: 2, folder: 1 },
  "2": { item: 3, folder: 2 },
} satisfies Record<string, DepthLimits | undefined>

export type Depth = keyof typeof LIMITS

export const DEPTHS = Object.keys(LIMITS) as Depth[]
