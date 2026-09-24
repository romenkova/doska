import type { PrefixOption } from "@doska/markdown"

/** A card a `[[12]]` in the body can point at. */
export interface CardRef {
  id: string
  /** The card number, as written between the brackets. */
  target: string
  title: string
  column: string
  /** Palette color id; empty when the column has none. */
  color: string
  done: boolean
}

export interface WebviewState {
  isPreview: boolean
  isDark: boolean
  tags: PrefixOption[]
  refs: CardRef[]
  /** Data URLs by attachment key. */
  images: Record<string, string>
}

export type ToWebview =
  | { type: "state"; state: WebviewState }
  /** The first body, and remote changes after it. */
  | { type: "body"; body: string }
  | { type: "insert"; snippet: string }

export type FromWebview =
  | { type: "ready" }
  /** Typing and task ticks alike. */
  | { type: "body"; body: string }
  | { type: "openRef"; id: string }
  /** Tapped the empty preview. */
  | { type: "edit" }
  | { type: "focus"; isFocused: boolean }
  /** Caret bottom, from the top of the page. */
  | { type: "caret"; bottom: number }
  | { type: "height"; height: number }
