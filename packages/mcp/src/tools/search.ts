import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import {
  type Card,
  type Column,
  type Dashboard,
  cardDisplayId,
} from "@doska/contract"
import { z } from "zod"
import type { Board } from "../board"
import { addDays, todayIso, UPCOMING_DAYS } from "@doska/utils"
import { PRIORITY_IDS } from "./cards"
import { reply } from "./reply"
import { shapeCard } from "./shape"

/** A card together with where it sits, which is what a cross-board result needs. */
interface Located {
  card: Card
  dashboard: Dashboard
  column: Column
}

/** How a located card goes back to a client. */
function result({ card, dashboard, column }: Located, bodies: boolean) {
  const shaped = shapeCard(card)
  return {
    ...shaped,
    body: bodies ? shaped.body : undefined,
    boardId: dashboard.id,
    boardTitle: dashboard.title,
    columnId: column.id,
    columnTitle: column.title,
    done: column.done,
  }
}

/** Everything `query` matches against, as one lowercased blob. */
function haystack({ card }: Located): string {
  const display = cardDisplayId(card.number) ?? ""
  return `${card.title}\n${card.body}\n${display}`.toLowerCase()
}

export function registerSearchTools(server: McpServer, board: Board): void {
  /** Every live card on `boardIds`, paired with its column and board. */
  async function collect(boardIds?: string[]): Promise<Located[]> {
    const dashboards = await board.dashboards()
    const wanted = boardIds
      ? dashboards.filter((d) => boardIds.includes(d.id))
      : dashboards

    const found: Located[] = []
    for (const dashboard of wanted) {
      const { columns, cards } = await board.board(dashboard.id)
      const columnById = new Map(columns.map((c) => [c.id, c]))
      for (const card of cards) {
        // A card whose column is tombstoned is gone from the board's point of
        // view, even though its own record is still live.
        const column = columnById.get(card.columnId)
        if (column) found.push({ card, dashboard, column })
      }
    }
    return found
  }

  server.registerTool(
    "search_cards",
    {
      title: "Search cards",
      description:
        "Find cards across every board by text, deadline range, priority, " +
        "or column. " +
        "Searches titles and Markdown bodies, so it also finds " +
        "[[card]] links. Cheaper than reading whole boards when you " +
        "know roughly what you're after.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe("Case-insensitive substring of the title or body"),
        boardIds: z
          .array(z.string())
          .optional()
          .describe("Restrict to these boards. Defaults to all of them"),
        deadlineFrom: z.string().optional().describe("Inclusive YYYY-MM-DD"),
        deadlineTo: z.string().optional().describe("Inclusive YYYY-MM-DD"),
        hasDeadline: z.boolean().optional(),
        priority: z
          .enum(PRIORITY_IDS)
          .optional()
          .describe("Only cards carrying this priority"),
        includeDone: z
          .boolean()
          .default(true)
          .describe("Include cards sitting in a board's done column"),
        bodies: z.boolean().default(false).describe("Include card bodies"),
        limit: z.number().int().min(1).max(200).default(50),
      },
    },
    async ({
      query,
      boardIds,
      deadlineFrom,
      deadlineTo,
      hasDeadline,
      priority,
      includeDone,
      bodies,
      limit,
    }) => {
      // One predicate per criterion the caller actually asked for, so an
      // unused filter is absent rather than a clause that waves everything
      // through. A card must satisfy all of them.
      const criteria: ((entry: Located) => boolean)[] = []

      if (!includeDone) criteria.push(({ column }) => !column.done)

      if (hasDeadline !== undefined)
        criteria.push(({ card }) => (card.deadline !== null) === hasDeadline)

      if (deadlineFrom)
        criteria.push(
          ({ card }) => card.deadline !== null && card.deadline >= deadlineFrom
        )

      if (deadlineTo)
        criteria.push(
          ({ card }) => card.deadline !== null && card.deadline <= deadlineTo
        )

      if (priority) criteria.push(({ card }) => card.priority === priority)

      const needle = query?.trim().toLowerCase()
      if (needle) criteria.push((entry) => haystack(entry).includes(needle))

      const matches = (await collect(boardIds)).filter((entry) =>
        criteria.every((criterion) => criterion(entry))
      )

      return reply({
        total: matches.length,
        cards: matches.slice(0, limit).map((entry) => result(entry, bodies)),
      })
    }
  )

  server.registerTool(
    "list_upcoming",
    {
      title: "List upcoming",
      description:
        "The app's upcoming view: every card with a deadline in range, " +
        "across all boards, in date order. Overdue cards come first — they " +
        "sort ahead of today. Cards in a done column are left out unless " +
        "you ask for them.",
      inputSchema: {
        range: z
          .enum(["today", "week", "all"])
          .default("week")
          .describe(
            `today: due today plus anything overdue. week: the next 7 days. all: through ${UPCOMING_DAYS} days out`
          ),
        includeDone: z.boolean().default(false),
        bodies: z.boolean().default(false),
      },
    },
    async ({ range, includeDone, bodies }) => {
      const today = todayIso()
      const to =
        range === "today"
          ? today
          : addDays(today, range === "week" ? 7 : UPCOMING_DAYS)

      const due = (await collect()).flatMap((entry) => {
        const { card, column } = entry
        if (card.deadline === null || card.deadline > to) return []
        if (column.done && !includeDone) return []
        // Carried alongside so the sort and the overdue flag don't have to
        // re-narrow it away from null.
        return [{ entry, deadline: card.deadline }]
      })
      due.sort((a, b) => (a.deadline < b.deadline ? -1 : 1))

      return reply({
        today,
        through: to,
        cards: due.map(({ entry, deadline }) => ({
          ...result(entry, bodies),
          overdue: deadline < today,
        })),
      })
    }
  )
}
