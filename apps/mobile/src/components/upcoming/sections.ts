import type { DigestGroup } from "@doska/core/operations"
import { deadlineLabel, longDate, weekday } from "@doska/core/utils"

export interface GroupSection {
  title: string
  /** The heading's weekday, empty for the dateless piles. */
  day: string
  /** The countdown beside it, empty for the dateless piles. */
  countdown: string
  kind: DigestGroup["kind"]
}

/** A group's `SectionList` section: its heading, and the entries as `data`. */
export function toSection(group: DigestGroup): GroupSection & {
  data: DigestGroup["entries"]
} {
  const dated = group.kind === "date"
  return {
    title:
      group.kind === "overdue"
        ? "Overdue"
        : group.kind === "undated"
          ? "No deadline"
          : longDate(group.date),
    day: dated ? weekday(group.date) : "",
    countdown: dated ? deadlineLabel(group.date) : "",
    kind: group.kind,
    data: group.entries,
  }
}
