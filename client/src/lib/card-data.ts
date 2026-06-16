/** A card: a short `title` plus a markdown `body`. This is the unit stored in
 * the db and seeded from the dummy fixtures below. */
export type Card = { title: string; body: string }

// Dummy cards, keyed by card id.
export const cardContent: Record<string, Card> = {
  A0: {
    title: "Onboarding flow",
    body: `Wire up the **new user** onboarding screens.

- [x] Welcome screen
- [ ] Profile setup
- [ ] Invite teammates

> Target ship date: _next sprint_.`,
  },

  A1: {
    title: "Fix login bug",
    body: `Users on \`Safari\` can't submit the form.

1. Reproduce on iOS
2. Patch the \`onSubmit\` handler
3. Add a regression test

\`\`\`ts
form.addEventListener("submit", handleSubmit)
\`\`\``,
  },

  A2: {
    title: "Research",
    body: `Compare drag-and-drop libraries:

| Library | Bundle | DX |
| --- | --- | --- |
| dnd-kit | small | great |
| react-beautiful-dnd | large | ok |

See [the docs](https://dndkit.com) for details.`,
  },

  B0: {
    title: "Design review",
    body: `Polish the **card component**.

- Rounded corners ✅
- Shadow on drag ✅
- Markdown rendering 🚧

Ping \`@design\` when ready.`,
  },

  B1: {
    title: "Marketing copy",
    body: `Draft the landing page hero.

> _"The fastest way to organize your work."_

Needs sign-off from **legal** before launch.`,
  },

  C0: {
    title: "Backlog idea",
    body: `Add keyboard shortcuts:

- \`⌘K\` — command palette
- \`⌘N\` — new card
- \`Esc\` — close drawer`,
  },

  MK0: {
    title: "Q3 campaign",
    body: `Plan the **summer launch** campaign.

- [ ] Define audience
- [ ] Draft messaging
- [ ] Book ad slots`,
  },

  MK1: {
    title: "Newsletter",
    body: `Write the monthly product update.

> Highlight the new **drag-and-drop** board.`,
  },

  MK2: {
    title: "Social calendar",
    body: `Schedule posts for the week across \`X\`, \`LinkedIn\`, and \`Bluesky\`.`,
  },

  EN0: {
    title: "API rate limiting",
    body: `Add per-token rate limits to the public API.

1. Pick a strategy (token bucket)
2. Add Redis counters
3. Return \`429\` with retry headers`,
  },

  EN1: {
    title: "Flaky tests",
    body: `Track down the intermittent failures in CI.

- [ ] Quarantine flaky specs
- [ ] Add retry instrumentation`,
  },

  EN2: {
    title: "Migrate to Vite 8",
    body: `Upgrade the build toolchain and verify HMR.`,
  },

  EN3: {
    title: "Ship dark mode",
    body: `Dark theme shipped 🎉 — toggle lives in the sidebar account menu.`,
  },
}

export const fallbackCard: Card = {
  title: "Untitled card",
  body: `Nothing here yet — _add some **markdown**!_`,
}

// Matches a GFM task-list marker at the start of a list item, e.g. "- [ ] ".
const TASK_RE = /^(\s*[-*+]\s+)\[([ xX])\]/gm

/** Counts completed / total task-list checkboxes in the markdown. */
export function taskProgress(markdown: string): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const [, , mark] of markdown.matchAll(TASK_RE)) {
    total++
    if (mark.toLowerCase() === "x") done++
  }
  return { done, total }
}

/** Flips the Nth (0-based) task-list checkbox and returns the new markdown. */
export function toggleTask(markdown: string, index: number): string {
  let i = 0
  return markdown.replace(TASK_RE, (full, prefix: string, mark: string) => {
    if (i++ !== index) return full
    return `${prefix}[${mark.toLowerCase() === "x" ? " " : "x"}]`
  })
}
