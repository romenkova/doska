import type { HistoryEntry } from "../../types"
import type { EditData } from "./record-edit"

type Rename = { from: string; to: string }
type Move = Rename & { fromBoard?: string; toBoard?: string }

function describeEdit({ fields, added, removed }: EditData): string {
  const parts = fields.map((field) =>
    field === "body" ? `body (+${added} -${removed})` : field
  )
  return `edited ${parts.join(", ")}`
}

function describeMove({ from, to, fromBoard, toBoard }: Move): string {
  if (fromBoard === undefined) return `moved from ${from} to ${to}`
  return `moved from ${from} (${fromBoard}) to ${to} (${toBoard})`
}

export function describeEntry(entry: HistoryEntry): string {
  switch (entry.action) {
    case "create":
      return "created"
    case "edit":
      return describeEdit(entry.data as EditData)
    case "rename": {
      const { from, to } = entry.data as Rename
      return `renamed from ${from} to ${to}`
    }
    case "move":
      return describeMove(entry.data as Move)
    case "delete":
      return "deleted"
    case "restore":
      return "restored"
  }
}
