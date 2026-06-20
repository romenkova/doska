export const CARDS = "cards"
export const COLUMNS = "columns"
export const DASHBOARDS = "dashboards"

export const STORES = [CARDS, COLUMNS, DASHBOARDS] as const
export type StoreName = (typeof STORES)[number]
