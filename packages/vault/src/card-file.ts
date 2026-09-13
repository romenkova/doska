import type { Attachment, Card } from "@doska/contract"
import {
  clean,
  num,
  render,
  split,
  str,
  toAttachmentRefs,
  toFileRefs,
  unshownIn,
} from "./card-format"

/** Keys the vault owns */
const KNOWN = [
  "id",
  "number",
  "title",
  "deadline",
  "priority",
  "attachments",
  "stamps",
  "bodyConflict",
  "syncedBody",
]

export type CardPatch = Partial<
  Pick<Card, "title" | "body" | "deadline" | "priority">
>

/**
 * A card as a Markdown file: its fields as YAML frontmatter, then the body.
 * Converts both ways, so this is the only place that knows how a card looks on
 * disk.
 */
export class CardFile {
  readonly id: string
  readonly number: number | null
  readonly title: string
  readonly body: string
  readonly deadline: string
  readonly priority: string
  readonly attachments: Attachment[]
  readonly extra: Record<string, unknown>

  constructor(fields: {
    id?: string
    number?: number | null
    title?: string
    body?: string
    deadline?: string
    priority?: string
    attachments?: Attachment[]
    extra?: Record<string, unknown>
  }) {
    this.id = fields.id ?? ""
    this.number = fields.number ?? null
    this.title = fields.title ?? ""
    this.body = clean(fields.body ?? "")
    this.deadline = fields.deadline ?? ""
    this.priority = fields.priority ?? ""
    this.attachments = fields.attachments ?? []
    this.extra = fields.extra ?? {}
  }

  static fromCard(card: Card, extra: Record<string, unknown> = {}): CardFile {
    return new CardFile({
      id: card.id,
      number: card.number,
      title: card.title,
      body: card.body,
      deadline: card.deadline ?? "",
      priority: card.priority,
      attachments: card.attachments,
      extra,
    })
  }

  static parse(source: string): CardFile {
    const { front, body } = split(source)
    if (front === null) return new CardFile({ body: toAttachmentRefs(body) })

    const extra: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(front)) {
      if (!KNOWN.includes(key)) extra[key] = value
    }

    return new CardFile({
      id: str(front.id),
      number: num(front.number),
      title: str(front.title),
      body: toAttachmentRefs(body),
      deadline: str(front.deadline),
      priority: str(front.priority),
      extra,
    })
  }

  get text(): string {
    const body = toFileRefs(this.body)
    const front: Record<string, unknown> = { id: this.id }
    if (this.number !== null) front.number = this.number
    front.title = this.title
    if (this.deadline) front.deadline = this.deadline
    if (this.priority) front.priority = this.priority
    const unshown = unshownIn(body, this.attachments)
    if (unshown.length > 0) front.attachments = unshown
    Object.assign(front, this.extra)

    return render(front, body)
  }

  /** What this file changes about `card`, or null when it says the same. */
  patchFor(card: Card): CardPatch | null {
    const patch: CardPatch = {}
    if (this.title !== card.title) patch.title = this.title
    if (this.body !== clean(card.body)) patch.body = this.body
    if (this.deadline !== (card.deadline ?? "")) {
      patch.deadline = this.deadline || null
    }
    if (this.priority !== card.priority) patch.priority = this.priority
    return Object.keys(patch).length > 0 ? patch : null
  }
}
