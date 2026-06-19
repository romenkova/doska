import type { z } from "zod"
import type {
  CardSchema,
  ChangeSchema,
  ColumnSchema,
  DashboardSchema,
} from "./schemas"

export * from "./schemas"
export { contract } from "./contract"

export type Card = z.infer<typeof CardSchema>
export type Column = z.infer<typeof ColumnSchema>
export type Dashboard = z.infer<typeof DashboardSchema>
export type Change = z.infer<typeof ChangeSchema>
