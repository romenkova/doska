import { PRIORITIES } from "@doska/tokens"
import { formatDeadlineShort } from "@doska/utils"
import type { HistoryEntry } from "../../types"

export type EntryPart =
  | { kind: "text"; text: string }
  | { kind: "title"; text: string }
  | { kind: "chip"; text: string; board?: string }
  | { kind: "user"; userId: string }
  | { kind: "arrow" }

type Data = {
  title?: string
  field?: string
  from?: unknown
  to?: unknown
  fromBoard?: string
  toBoard?: string
}

type ListField = "tags" | "users" | "attachments"

const VERBS: Record<HistoryEntry["action"], string> = {
  create: "created",
  edit: "edited",
  rename: "renamed",
  move: "moved",
  delete: "deleted",
  restore: "restored",
}

const LIST_VERBS: Record<ListField, { added: string; removed: string }> = {
  tags: { added: "added", removed: "removed" },
  users: { added: "assigned", removed: "unassigned" },
  attachments: { added: "attached", removed: "removed" },
}

const text = (text: string): EntryPart => ({ kind: "text", text })
const chip = (text: string, board?: string): EntryPart => ({
  kind: "chip",
  text,
  board,
})
const arrow: EntryPart = { kind: "arrow" }

const asText = (value: unknown) => (typeof value === "string" ? value : "")
const asList = (value: unknown) => (Array.isArray(value) ? value : [])

function itemParts(field: ListField, items: string[]): EntryPart[] {
  if (field === "users")
    return items.map((userId) => ({ kind: "user", userId }))
  if (field === "tags") return items.map((tag) => chip(`#${tag}`))
  return items.map((item) => chip(item))
}

/** "added [#a] to Fix login and removed [#b]" */
function describeList(
  field: ListField,
  name: EntryPart[],
  from: string[],
  to: string[]
): EntryPart[] | null {
  const added = itemParts(
    field,
    to.filter((item) => !from.includes(item))
  )
  const removed = itemParts(
    field,
    from.filter((item) => !to.includes(item))
  )
  const verbs = LIST_VERBS[field]

  if (added.length > 0 && removed.length > 0)
    return [
      text(verbs.added),
      ...added,
      text("to"),
      ...name,
      text(`and ${verbs.removed}`),
      ...removed,
    ]
  if (added.length > 0)
    return [text(verbs.added), ...added, text("to"), ...name]
  if (removed.length > 0)
    return [text(verbs.removed), ...removed, text("from"), ...name]
  // Added then removed again within one merged row.
  return null
}

function describeValue(
  label: string,
  name: EntryPart[],
  value: string
): EntryPart[] {
  if (!value) return [text(`cleared ${label} of`), ...name]
  return [text(`set ${label} of`), ...name, text("to"), chip(value)]
}

function priorityLabel(id: string): string {
  if (!id) return ""
  return PRIORITIES.find((priority) => priority.id === id)?.label ?? id
}

function deadlineLabel(date: string): string {
  if (!date) return ""
  return formatDeadlineShort(date)
}

function describeEdit(data: Data, name: EntryPart[]): EntryPart[] | null {
  switch (data.field) {
    case "priority":
      return describeValue("priority", name, priorityLabel(asText(data.to)))
    case "deadline":
      return describeValue("deadline", name, deadlineLabel(asText(data.to)))
    case "tags":
    case "users":
    case "attachments":
      return describeList(data.field, name, asList(data.from), asList(data.to))
    default:
      return null
  }
}

/** The row as a sentence, minus who did it: "moved card Fix login [Todo] → [Done]". */
export function describeEntry(entry: HistoryEntry): EntryPart[] {
  const data = entry.data as Data
  const name: EntryPart[] = data.title
    ? [{ kind: "title", text: data.title }]
    : []
  const verb = text(`${VERBS[entry.action]} ${entry.entityType}`)
  const plain = [verb, ...name]

  switch (entry.action) {
    case "rename":
      return [verb, chip(asText(data.from)), arrow, chip(asText(data.to))]
    case "move":
      return [
        ...plain,
        chip(asText(data.from), data.fromBoard),
        arrow,
        chip(asText(data.to), data.toBoard),
      ]
    case "edit":
      return describeEdit(data, name) ?? plain
    default:
      return plain
  }
}
