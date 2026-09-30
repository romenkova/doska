import type { Attachment } from "@doska/contract"
import { parse, stringify } from "yaml"

const FENCE = "---"

/** Attachments mirror into `<root>/_files` */
export const FILES = "_files"
const FILES_REF = `../${FILES}/`

/** An attachment's name inside `_files`. Keys are `att/<uuid>.<ext>`. */
export function fileNameOf(key: string): string {
  return key.slice(key.indexOf("/") + 1)
}

const ATTACHMENT_SRC = /(!\[[^\]]*\]\()attachment:att\/([^)\s]+\))/g
const FILE_SRC = /(!\[[^\]]*\]\()\.\.\/_files\/([^)\s]+\))/g

export function toFileRefs(body: string): string {
  return body.replace(ATTACHMENT_SRC, (_, open: string, rest: string) => {
    return `${open}${FILES_REF}${rest}`
  })
}

export function toAttachmentRefs(body: string): string {
  return body.replace(FILE_SRC, (_, open: string, rest: string) => {
    return `${open}attachment:att/${rest}`
  })
}

export function clean(body: string): string {
  return body.replace(/\r\n?/g, "\n").trim()
}

export function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim()
}

export function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string" || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Comma/space separated string. */
export function tagList(value: unknown): string[] {
  const items = Array.isArray(value)
    ? value.map(str)
    : str(value).split(/[\s,]+/)
  return items.map((tag) => tag.replace(/^#/, "")).filter(Boolean)
}

/**
 * Frontmatter and body
 */
export function split(source: string): {
  front: Record<string, unknown> | null
  body: string
} {
  const all = { front: null, body: source }
  const lines = source.replace(/\r\n?/g, "\n").split("\n")
  const close = lines[0] === FENCE ? lines.indexOf(FENCE, 1) : -1
  if (close === -1) return all

  let fields: unknown
  try {
    fields = parse(lines.slice(1, close).join("\n"))
  } catch {
    return all
  }
  if (typeof fields !== "object" || fields === null || Array.isArray(fields)) {
    return all
  }

  return {
    front: fields as Record<string, unknown>,
    body: lines.slice(close + 1).join("\n"),
  }
}

export function unshownIn(
  body: string,
  attachments: Attachment[]
): { name: string; file: string }[] {
  return attachments
    .map((attachment) => ({
      name: attachment.name,
      file: FILES_REF + fileNameOf(attachment.key),
    }))
    .filter((attachment) => !body.includes(attachment.file))
}

export function render(front: Record<string, unknown>, body: string): string {
  const trailing = body ? `${body}\n` : ""
  return `${FENCE}\n${stringify(front, { lineWidth: 0 })}${FENCE}\n${trailing}`
}
