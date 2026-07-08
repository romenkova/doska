import { parse as parseYaml, stringify as stringifyYaml } from "yaml"

/**
 * A Markdown file with YAML frontmatter:
 *
 * ```md
 * ---
 * id: abc
 * title: My card
 * ---
 * The body.
 * ```
 *
 * Generic, deck-agnostic codec. The deck-specific mapping of records to these
 * `data` bags lives in `mapping.ts`.
 */

/** A parsed frontmatter document: the YAML `data` bag plus the Markdown `body`. */
export interface FrontmatterDoc {
  data: Record<string, unknown>
  body: string
}

const FENCE = "---"

/**
 * Serializes `data` as a YAML frontmatter block followed by `body`. Keys with
 * `undefined` values are dropped so we never emit `key: null` for "unset" —
 * callers pass only the fields they want persisted.
 */
export function stringifyFrontmatter(
  data: Record<string, unknown>,
  body: string
): string {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) clean[key] = value
  }
  // `yaml` appends its own trailing newline; keep the block tight and let the
  // body follow after the closing fence.
  const yaml = stringifyYaml(clean).replace(/\n$/, "")
  return `${FENCE}\n${yaml}\n${FENCE}\n${body}`
}

/**
 * Parses a Markdown string into `{ data, body }`. A file with no leading
 * frontmatter fence is treated as all-body with an empty `data` bag (this is how
 * a hand-authored `.md` with no metadata gets adopted). Malformed YAML also
 * degrades to an empty bag rather than throwing, so one bad file can't wedge a
 * whole folder scan.
 */
export function parseFrontmatter(text: string): FrontmatterDoc {
  // Normalize CRLF so external editors on Windows don't defeat the fence match.
  const normalized = text.replace(/\r\n/g, "\n")
  if (!normalized.startsWith(`${FENCE}\n`)) {
    return { data: {}, body: text }
  }

  const end = normalized.indexOf(`\n${FENCE}`, FENCE.length)
  if (end === -1) return { data: {}, body: text }

  const yaml = normalized.slice(FENCE.length + 1, end)
  // Body starts after the closing fence line; skip its trailing newline if any.
  const afterFence = end + `\n${FENCE}`.length
  const body = normalized.slice(afterFence).replace(/^\n/, "")

  let data: Record<string, unknown> = {}
  try {
    const parsed = parseYaml(yaml)
    if (parsed && typeof parsed === "object")
      data = parsed as Record<string, unknown>
  } catch {
    // Malformed frontmatter: treat as no metadata, keep the raw body.
    return { data: {}, body }
  }

  return { data, body }
}
