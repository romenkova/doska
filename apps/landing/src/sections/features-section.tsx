import { Section } from "./section"

const features = [
  {
    title: "Markdown editor",
    text: "Syntax highlighting, a slash menu, attachments, and cards that cross-reference each other.",
  },
  {
    title: "Single sign-on",
    text: "Any OIDC provider on a self-hosted server.",
  },
  {
    title: "Row view",
    text: "Every card as one list grouped by deadline. Tick the box to mark it done.",
  },
  {
    title: "Deadlines and priorities",
    text: "Both sortable.",
  },
  {
    title: "Search",
    text: "Cmd+K on a board. Matches the id, the title and the body.",
  },
  {
    title: "MCP",
    text: "Let agents manage your boards and cards.",
  },
  {
    title: "Undo",
    text: "Deleting a card offers an undo toast. Everything else lands in the trash.",
  },
  {
    title: "Local first",
    text: "Boards stored locally, so the app is quick and works offline. Sync is on top.",
  },
  {
    title: "Self-hosted sync server",
    text: "One install script and Docker Compose. Syncs boards across devices and makes sharing possible.",
  },
  {
    title: "Sync to folder",
    text: "Mirror a board to a folder on disk, two way. Folder per column, markdown file per card. Desktop only.",
  },
  {
    title: "Desktop app",
    text: "Same boards as the browser, plus folder sync.",
  },
  {
    title: "Sidebar folders",
    text: "Group boards into folders and reorder them. The layout syncs between devices.",
  },
  {
    title: "MIT licensed",
    text: "Open source and free.",
  },
]

export function FeaturesSection() {
  return (
    <Section title="All features">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-2xl border bg-card p-4">
            <div className="font-semibold">{feature.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
