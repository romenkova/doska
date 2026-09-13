import type { Card, Column } from "@doska/contract"
import { cardDisplayId } from "@doska/contract/card-id"
import { taskProgress } from "@doska/markdown/core"

/**
 * How a card goes back to a client: the ids it can be addressed by, its
 * deadline and priority, its task-list progress, and its attachments by name
 * only — the
 * bytes live behind the app's file endpoints, not the sync channel.
 */
export function shapeCard(card: Card) {
  const { done, total } = taskProgress(card.body)
  return {
    id: card.id,
    // The human-readable id automations reference, e.g. 12.
    cardId: cardDisplayId(card.number),
    title: card.title,
    body: card.body,
    deadline: card.deadline,
    // Stored as "" for none, but reported as null to match what the tools take.
    priority: card.priority || null,
    tasks: total > 0 ? { done, total } : null,
    attachments: card.attachments.map(({ name, mime, size }) => ({
      name,
      mime,
      size,
    })),
  }
}

/** A column as the tools report it: what an agent can act on, no sync state. */
export function shapeColumn(column: Column) {
  return {
    id: column.id,
    title: column.title,
    done: column.done,
    color: column.color || null,
    collapsed: column.collapsed,
  }
}
