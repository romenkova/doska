import type { HistoryEntry } from "../../types"

type Data = {
  title?: string
  from?: string
  to?: string
  fromBoard?: string
  toBoard?: string
}

/** Names what the row is about: "created column Todo". */
export function describeEntry(entry: HistoryEntry): string {
  const { title, from, to, fromBoard, toBoard } = entry.data as Data
  const entity = ` ${entry.entityType}`
  const name = title ? ` ${title}` : ""

  switch (entry.action) {
    case "create":
      return `created${entity}${name}`
    case "edit":
      return `edited${entity}${name}`
    case "rename":
      return `renamed${entity} from ${from} to ${to}`
    case "move":
      if (fromBoard === undefined)
        return `moved${entity}${name} from ${from} to ${to}`
      return `moved${entity}${name} from ${from} (${fromBoard}) to ${to} (${toBoard})`
    case "delete":
      return `deleted${entity}${name}`
    case "restore":
      return `restored${entity}${name}`
  }
}
