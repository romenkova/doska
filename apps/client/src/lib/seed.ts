import type { Card, Column, Dashboard } from "./types"

const REPO = "https://github.com/romenkova/doska"

/**
 * The board a fresh install opens on — the same tour the landing page tells,
 * as real cards. Keep the two in sync (`apps/landing/src/board.tsx`).
 */
export const cards: Card[] = [
  {
    id: "seed-cards-1",
    columnId: "cards",
    position: "a0",
    number: 1,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Cards are Markdown",
    body: `GitHub-flavored Markdown, edited in place — **bold**, \`code\`, [links](${REPO}), ==highlights==. Task lists carry a live count, up in the header:

- [x] Written in Markdown
- [x] Slash menu for formatting
- [ ] Tick a box — watch the count
- [ ] Nothing left to do`,
  },
  {
    id: "seed-cards-2",
    columnId: "cards",
    position: "a1",
    number: 2,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Attachments and tags",
    body: `Drop images or files onto a card. Images preview inline, everything else lands as a link.

Bracketed words become colored pills, so a card can carry its own labels: [design] [needs review]`,
  },
  {
    id: "seed-cards-3",
    columnId: "cards",
    position: "a2",
    number: 3,
    deadline: "2020-04-01",
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Deadlines",
    body: `Set a due date and the chip shifts color as it nears — muted, then amber, then red once it's overdue. Like this one, which has been overdue for a while.`,
  },
  {
    id: "seed-cards-4",
    columnId: "cards",
    position: "a3",
    number: 4,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Cards link to cards",
    body: `Type \`[[\` and pick a card. The reference carries its title and the column it's in — both read live, so a rename or a move updates every mention:

[[DECK-3]]`,
  },
  {
    id: "seed-data-1",
    columnId: "where",
    position: "a0",
    number: 5,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Local-first",
    body: `Boards live in the browser (IndexedDB). Reads and writes hit your device, not the network — so it's fast, and it works offline.`,
  },
  {
    id: "seed-data-2",
    columnId: "where",
    position: "a1",
    number: 6,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Sync is opt-in",
    body: `Point it at a server you run and boards replicate to every device in the background. Nothing leaves your machine until you set that up.`,
  },
  {
    id: "seed-run-1",
    columnId: "run",
    position: "a0",
    number: 7,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Self-host in one line",
    body: `\`\`\`
curl -fsSL https://raw.githubusercontent.com/romenkova/doska/main/install.sh -o install.sh && sh install.sh
\`\`\`

Generates the secrets and brings the stack up. Re-run any time to pull newer images — it keeps your config. There's a [self-hosting guide](${REPO}#self-hosting).`,
  },
  {
    id: "seed-run-2",
    columnId: "run",
    position: "a1",
    number: 8,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Runs where you do",
    body: `In the browser, installed as a PWA, or a native macOS app that reuses the same client and auto-updates.`,
  },
  {
    id: "seed-run-3",
    columnId: "run",
    position: "a2",
    number: 9,
    deadline: null,
    attachments: [],
    updatedAt: 0,
    deletedAt: null,
    title: "Agents can edit it too",
    body: `The server exposes your boards over MCP, so Claude can read and edit them — create cards, tick task lists, move things.

\`\`\`
claude mcp add --transport http doska https://your-server/mcp
\`\`\``,
  },
]

export const fallbackCard: Card = {
  id: "1",
  columnId: "1",
  position: "a0",
  number: null,
  deadline: null,
  attachments: [],
  updatedAt: 0,
  deletedAt: null,
  title: "Untitled card",
  body: "",
}

/** Columns of the welcome board — they hold the seed cards above. */
export const seedColumns: Column[] = [
  {
    id: "cards",
    title: "Cards",
    position: "a0",
    dashboardId: "welcome",
    collapsed: false,
    color: "violet",
    updatedAt: 0,
    deletedAt: null,
  },
  {
    id: "where",
    title: "Where it lives",
    position: "a1",
    dashboardId: "welcome",
    collapsed: false,
    color: "green",
    updatedAt: 0,
    deletedAt: null,
  },
  {
    id: "run",
    title: "Run it",
    position: "a2",
    dashboardId: "welcome",
    collapsed: false,
    color: "amber",
    updatedAt: 0,
    deletedAt: null,
  },
]

/** Templates every newly created board starts with. */
export const BOARD_COLUMNS: Column[] = [
  {
    id: "todo",
    title: "To Do",
    position: "a0",
    dashboardId: "",
    collapsed: false,
    color: "",
    updatedAt: 0,
    deletedAt: null,
  },
  {
    id: "doing",
    title: "In Progress",
    position: "a1",
    dashboardId: "",
    collapsed: false,
    color: "",
    updatedAt: 0,
    deletedAt: null,
  },
  {
    id: "done",
    title: "Done",
    position: "a2",
    dashboardId: "",
    collapsed: false,
    color: "",
    updatedAt: 0,
    deletedAt: null,
  },
]

export const seedDashboards: Dashboard[] = [
  {
    id: "welcome",
    title: "Welcome",
    position: "a0",
    prefix: "DECK",
    updatedAt: 0,
    deletedAt: null,
  },
]
