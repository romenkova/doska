import type { Card, Column, Dashboard } from "./types"

export const cards: Card[] = [
  {
    id: "C1",
    columnId: "todo",
    position: "a0",
    title: "Onboarding flow",
    body: `Wire up the **new user** onboarding screens.

  - [x] Welcome screen
  - [ ] Profile setup
  - [ ] Invite teammates

  > Target ship date: _next sprint_.`,
  },
]

export const fallbackCard: Card = {
  id: "1",
  columnId: "1",
  position: "a0",
  title: "Untitled card",
  body: `Nothing here yet — _add some **markdown**!_`,
}

export const BOARD_COLUMNS: Column[] = [
  { id: "todo", title: "To Do", position: "a0", dashboardId: "product" },
  { id: "doing", title: "In Progress", position: "a1", dashboardId: "product" },
  { id: "done", title: "Done", position: "a2", dashboardId: "product" },
  { id: "paused", title: "Paused", position: "a3", dashboardId: "product" },
]

export const seedDashboards: Dashboard[] = [
  {
    id: "product",
    title: "Product Roadmap",
    position: "a0",
  },
]
