export type Column = { id: string; title: string }

/** Card ids grouped by column id, for one board. */
export type BoardItems = Record<string, string[]>

/** A board's metadata. Its card arrangement lives in the boards store. */
export type Dashboard = {
  id: string
  name: string
  columns: Column[]
}

export const BOARD_COLUMNS: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "doing", title: "In Progress" },
  { id: "done", title: "Done" },
  { id: "paused", title: "Paused" },
]

/**
 * First-run fixtures: each board's metadata plus the cards seeded onto it.
 * The metadata is persisted as the dashboards list; the items seed the boards
 * store. See `lib/api/db.ts`.
 */
export const seedDashboards: (Dashboard & { items: BoardItems })[] = [
  {
    id: "product",
    name: "Product Roadmap",
    columns: BOARD_COLUMNS,
    items: {
      todo: ["A0", "A1", "A2"],
      doing: ["B0", "B1"],
      done: ["C0"],
    },
  },
  {
    id: "marketing",
    name: "Marketing",
    columns: BOARD_COLUMNS,
    items: {
      todo: ["MK0", "MK1"],
      doing: ["MK2"],
      done: [],
    },
  },
  {
    id: "engineering",
    name: "Engineering",
    columns: BOARD_COLUMNS,
    items: {
      todo: ["EN0", "EN1"],
      doing: ["EN2"],
      done: ["EN3"],
    },
  },
]

/** Dashboard metadata only, used as the default landing board in the router. */
export const dashboards: Dashboard[] = seedDashboards.map((d) => ({
  id: d.id,
  name: d.name,
  columns: d.columns,
}))
