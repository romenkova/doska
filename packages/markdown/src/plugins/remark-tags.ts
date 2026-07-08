// Number of predefined pill colors. Must match the `[data-tag-color]` rules in
// markdown.css.
export const TAG_COLOR_COUNT = 10

interface MdastNode {
  type: string
  value?: string
  children?: MdastNode[]
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

// Matches a `[content]` tag: square brackets with non-empty inner text that
// contains no brackets of its own. Links/images are already separate mdast
// nodes by the time this runs, so a bracket pair surviving in a text node is a
// literal `[...]` and safe to treat as a tag.
const TAG_RE = /\[([^[\]\n]+)\]/g

// Deterministic string hash (djb2). Used as the preferred palette slot for a
// tag, so the same text starts from the same color.
function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i)
  }
  return Math.abs(h)
}

// Assigns palette indices for one document: the same tag text always reuses its
// index, and distinct tags avoid colliding by probing forward from their hashed
// slot to the next free one. Past TAG_COLOR_COUNT distinct tags every slot is
// taken, so we fall back to the raw hashed slot.
function makeColorPicker() {
  const assigned = new Map<string, number>()
  const used = new Set<number>()
  return (text: string): number => {
    const existing = assigned.get(text)
    if (existing != null) return existing
    const start = hash(text) % TAG_COLOR_COUNT
    let index = start
    if (used.size < TAG_COLOR_COUNT) {
      while (used.has(index)) index = (index + 1) % TAG_COLOR_COUNT
    }
    assigned.set(text, index)
    used.add(index)
    return index
  }
}

type ColorPicker = (text: string) => number

function pill(label: string, pickColor: ColorPicker): MdastNode {
  return {
    type: "emphasis",
    data: {
      hName: "span",
      hProperties: {
        className: ["tag"],
        dataTagColor: pickColor(label.toLowerCase()),
      },
    },
    children: [{ type: "text", value: label }],
  }
}

// Splits a text value on `[...]` tags, returning text nodes interleaved with
// pill nodes.
function splitText(value: string, pickColor: ColorPicker): MdastNode[] {
  const nodes: MdastNode[] = []
  let last = 0
  for (const match of value.matchAll(TAG_RE)) {
    const start = match.index ?? 0
    if (start > last)
      nodes.push({ type: "text", value: value.slice(last, start) })
    nodes.push(pill(match[1], pickColor))
    last = start + match[0].length
  }
  if (last < value.length)
    nodes.push({ type: "text", value: value.slice(last) })
  return nodes
}

function transform(node: MdastNode, pickColor: ColorPicker) {
  if (!node.children) return
  const out: MdastNode[] = []
  for (const child of node.children) {
    if (
      child.type === "text" &&
      child.value &&
      /\[[^[\]\n]+\]/.test(child.value)
    ) {
      out.push(...splitText(child.value, pickColor))
    } else {
      transform(child, pickColor)
      out.push(child)
    }
  }
  node.children = out
}

/**
 * Renders `[content]` as a colored pill ("tag"). The color is picked from a
 * predefined palette by hashing the tag text, so the same text gets the same
 * color; within a single document, distinct tags are nudged to different colors
 * so no two pills share a color until the palette is exhausted.
 */
export function remarkTags() {
  return (tree: MdastNode) => transform(tree, makeColorPicker())
}
