import { diffLines } from "diff"
import { sameLines, splitLines } from "./utils"

type Edit = { start: number; end: number; lines: string[] }
type Region = { start: number; end: number; ours: Edit[]; theirs: Edit[] }

/**
 * Three-way merge of a card body, line by line. `ours` wins when both sides
 * changed the same lines.
 */
export function mergeBody(
  base: string,
  ours: string,
  theirs: string
): { body: string; conflict: boolean } {
  if (ours === theirs || theirs === base) return { body: ours, conflict: false }
  if (ours === base) return { body: theirs, conflict: false }

  const baseLines = splitLines(base)
  const ourEdits = findEdits(baseLines, splitLines(ours))
  const theirEdits = findEdits(baseLines, splitLines(theirs))
  const regions = groupIntoRegions(ourEdits, theirEdits)

  const result: string[] = []
  let conflict = false
  let pos = 0

  for (const region of regions) {
    result.push(...baseLines.slice(pos, region.start))

    const resolved = resolveRegion(region, baseLines)
    result.push(...resolved.lines)
    if (resolved.conflict) conflict = true

    pos = region.end
  }
  result.push(...baseLines.slice(pos))

  const trailingNewline = ours.endsWith("\n") ? "\n" : ""
  return { body: result.join("\n") + trailingNewline, conflict }
}

/** The edits that turn `base` into `changed`. */
function findEdits(base: string[], changed: string[]): Edit[] {
  const edits: Edit[] = []
  let current: Edit = { start: 0, end: 0, lines: [] }
  const isEmpty = (edit: Edit) =>
    edit.start === edit.end && edit.lines.length === 0

  // jsdiff gives the two texts as one sequence of parts. Removed and added
  // parts grow the current edit, an unchanged part closes it and opens the
  // next one right after itself.
  const diff = diffLines(base.join("\n"), changed.join("\n"))
  for (const part of diff) {
    const lines = splitLines(part.value)

    if (part.added) {
      current.lines.push(...lines)
      continue
    }

    if (part.removed) {
      current.end += lines.length
      continue
    }

    if (!isEmpty(current)) edits.push(current)
    const next = current.end + lines.length
    current = { start: next, end: next, lines: [] }
  }

  if (!isEmpty(current)) edits.push(current)

  return edits
}

/**
 * Splits both edit lists, which are sorted by `start`, into regions
 */
function groupIntoRegions(ourEdits: Edit[], theirEdits: Edit[]): Region[] {
  const regions: Region[] = []
  let oursLeft = ourEdits
  let theirsLeft = theirEdits

  while (oursLeft.length > 0 || theirsLeft.length > 0) {
    const region = nextRegion(oursLeft, theirsLeft)
    regions.push(region)
    oursLeft = oursLeft.slice(region.ours.length)
    theirsLeft = theirsLeft.slice(region.theirs.length)
  }
  return regions
}

/** One region, starting from the earliest edit on either side. */
function nextRegion(ourEdits: Edit[], theirEdits: Edit[]): Region {
  const first = earliest(ourEdits, theirEdits)
  const region: Region = {
    start: first.start,
    end: first.end,
    ours: [],
    theirs: [],
  }

  // Every edit taken can widen the region, and a wider region can reach the
  // next edit on the other side, so alternate until neither side adds one.
  let grew = true
  while (grew) {
    const oursGrew = takeOverlapping(region, region.ours, ourEdits)
    const theirsGrew = takeOverlapping(region, region.theirs, theirEdits)
    grew = oursGrew || theirsGrew
  }
  return region
}

/** Called only when at least one side still has edits. On a tie ours goes first. */
function earliest(ourEdits: Edit[], theirEdits: Edit[]): Edit {
  const ours = ourEdits[0]
  const theirs = theirEdits[0]
  if (!ours) return theirs
  if (!theirs) return ours
  return ours.start <= theirs.start ? ours : theirs
}

/**
 * Copies edits from `edits` into `taken`, continuing after the ones already
 * there, while they overlap the region. Widens the region as it goes.
 */
function takeOverlapping(
  region: Region,
  taken: Edit[],
  edits: Edit[]
): boolean {
  let tookAny = false
  for (const edit of edits.slice(taken.length)) {
    if (!overlaps(region, edit)) break
    taken.push(edit)
    region.end = Math.max(region.end, edit.end)
    tookAny = true
  }
  return tookAny
}

/**
 * Does the edit fight over the same base lines as the region?
 */
function overlaps(region: Region, edit: Edit): boolean {
  const regionIsInsertion = region.start === region.end
  const editIsInsertion = edit.start === edit.end

  if (regionIsInsertion && editIsInsertion) return region.start === edit.start
  if (editIsInsertion) return isInside(edit.start, region)
  if (regionIsInsertion) return isInside(region.start, edit)
  return edit.start < region.end && edit.end > region.start
}

function isInside(
  spot: number,
  range: { start: number; end: number }
): boolean {
  return spot > range.start && spot < range.end
}

/**
 * The region's final lines
 */
function resolveRegion(
  region: Region,
  base: string[]
): { lines: string[]; conflict: boolean } {
  const ourVersion = render(base, region, region.ours)
  const theirVersion = render(base, region, region.theirs)
  const onlyTheirsChanged = region.ours.length === 0
  const bothChanged = region.ours.length > 0 && region.theirs.length > 0

  return {
    lines: onlyTheirsChanged ? theirVersion : ourVersion,
    conflict: bothChanged && !sameLines(ourVersion, theirVersion),
  }
}

/** The region's base lines with one side's edits applied. */
function render(base: string[], region: Region, edits: Edit[]): string[] {
  const out: string[] = []
  let pos = region.start

  for (const edit of edits) {
    out.push(...base.slice(pos, edit.start), ...edit.lines)
    pos = edit.end
  }

  out.push(...base.slice(pos, region.end))
  return out
}
