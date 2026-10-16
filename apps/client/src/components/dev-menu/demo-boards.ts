import {
  createCard,
  createDashboard,
  getBoard,
  queryClient,
  updateCard,
  type Card,
} from "@doska/core"

type DemoCard = Partial<Pick<Card, "body" | "deadline" | "priority" | "tags">>

/** YYYY-MM-DD, `offset` days from today, local time. */
function day(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const dayOfMonth = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${dayOfMonth}`
}

/** Card titles per column, in the board's column order. */
const BOARDS: { title: string; columns: Record<string, DemoCard>[] }[] = [
  {
    title: "Demo: Product",
    columns: [
      {
        "Write the release notes": {
          deadline: day(2),
          priority: "high",
          tags: ["docs"],
        },
        "Onboarding copy pass": { tags: ["copy"] },
        "Check the update toast on Windows": {
          body: "- [ ] Installer\n- [ ] Portable\n- [x] Mac",
          tags: ["desktop"],
        },
      },
      {
        "Card history": {
          deadline: day(0),
          priority: "medium",
          body: "Shows activity for the past 14 days.\n\n-cut-\n\nDetails below the cut.",
        },
        "Fix the sync bug": { deadline: day(-3), priority: "high" },
      },
      {
        "Formatting shortcuts": { tags: ["editor"] },
        "Card modal": { priority: "low" },
      },
    ],
  },
  {
    title: "Demo: Personal",
    columns: [
      {
        "Book the dentist": { deadline: day(10) },
        Groceries: { body: "- [ ] Oat milk\n- [ ] Coffee\n- [ ] Lemons" },
      },
      { Taxes: { deadline: day(30), priority: "high" } },
      { "Renew passport": {} },
    ],
  },
]

export async function seedDemoBoards() {
  for (const board of BOARDS) {
    const dashboard = await createDashboard(board.title)
    const { columns } = await getBoard(dashboard.id)
    for (const [index, cards] of board.columns.entries()) {
      const column = columns[index]
      if (!column) break
      // createCard puts a card on top, so go bottom up
      for (const [title, fields] of Object.entries(cards).reverse()) {
        const id = await createCard(column.id)
        await updateCard(id, { title, ...fields })
      }
    }
  }
  await queryClient.invalidateQueries()
}
