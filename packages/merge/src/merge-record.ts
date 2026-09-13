
/** A record with one stamp per group */
export type Stamped<G extends string> = {
  updatedAt: number
  stamps?: Partial<Record<G, number>>
}

/** Which group each mergeable field of `T` belongs to */
export type FieldGroups<T, G extends string> = Partial<
  Record<keyof T & string, G>
>

/**
 * Per-group LWW
 */
export function mergeRecord<G extends string, T extends Stamped<G>>(
  stored: T | undefined,
  incoming: T,
  fieldGroups: FieldGroups<T, G>
): { record: T; changed: boolean } {
  const groups = groupsIn(fieldGroups)
  const incomingStamps = stampOfEveryGroup(incoming, groups)

  if (stored === undefined) {
    return { record: withStamps(incoming, incomingStamps), changed: true }
  }

  const storedStamps = stampOfEveryGroup(stored, groups)
  const record = { ...stored }
  const stamps = { ...storedStamps }
  let changed = false

  for (const group of groups) {
    const incomingIsNewer = incomingStamps[group] > storedStamps[group]
    if (!incomingIsNewer) continue

    for (const field of fieldsIn(fieldGroups, group))
      record[field] = incoming[field]
    stamps[group] = incomingStamps[group]
    changed = true
  }

  return { record: withStamps(record, stamps), changed }
}

/**
 * A missing stamp reads as the record's own `updatedAt`. That is what makes
 * rows and clients without stamps compare like before: whole-record LWW.
 */
function stampOfEveryGroup<G extends string>(
  record: Stamped<G>,
  groups: G[]
): Record<G, number> {
  const stamps = {} as Record<G, number>
  for (const group of groups) {
    stamps[group] = record.stamps?.[group] ?? record.updatedAt
  }
  return stamps
}

/** `updatedAt` follows the newest stamp: old clients still read only that. */
function withStamps<G extends string, T extends Stamped<G>>(
  record: T,
  stamps: Record<G, number>
): T {
  return { ...record, stamps, updatedAt: newest(stamps) }
}

function newest<G extends string>(stamps: Record<G, number>): number {
  let max = 0
  for (const stamp of Object.values<number>(stamps)) {
    if (stamp > max) max = stamp
  }
  return max
}

function groupsIn<T, G extends string>(fieldGroups: FieldGroups<T, G>): G[] {
  const groups: G[] = []
  for (const group of Object.values<G | undefined>(fieldGroups)) {
    if (group !== undefined && !groups.includes(group)) groups.push(group)
  }
  return groups
}

function fieldsIn<T, G extends string>(
  fieldGroups: FieldGroups<T, G>,
  group: G
): (keyof T & string)[] {
  const fields: (keyof T & string)[] = []
  for (const [field, fieldGroup] of Object.entries(fieldGroups)) {
    if (fieldGroup === group) fields.push(field as keyof T & string)
  }
  return fields
}
