import { CardSchema, ColumnSchema, DashboardSchema } from "@doska/contract"
import { logError } from "../../report-error"
import { CARDS, COLUMNS, DASHBOARDS } from "../constants"

const SCHEMAS: Record<
  string,
  typeof CardSchema | typeof ColumnSchema | typeof DashboardSchema | undefined
> = {
  [CARDS]: CardSchema,
  [COLUMNS]: ColumnSchema,
  [DASHBOARDS]: DashboardSchema,
}

/** Fills a record's missing fields from its schema; a record that doesn't fit is kept as is. */
export function withDefaults(store: string, value: unknown): unknown {
  const schema = SCHEMAS[store]
  if (!schema) return value
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")
  const error = new Error(`${store} record doesn't match its schema: ${issues}`)
  console.warn(error)
  logError(error)
  return value
}
