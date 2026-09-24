import { TAG_RE } from "../tag"

interface MdastNode {
  type: string
  value?: string
  children?: MdastNode[]
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

function tag(name: string): MdastNode {
  return {
    type: "emphasis",
    data: {
      hName: "span",
      hProperties: { className: ["tag"], dataTag: name },
    },
    children: [{ type: "text", value: `#${name}` }],
  }
}

// Splits a text value on `#tag`, returning text nodes interleaved with tag nodes.
function splitText(value: string): MdastNode[] {
  const nodes: MdastNode[] = []
  let last = 0
  for (const match of value.matchAll(TAG_RE)) {
    const start = (match.index ?? 0) + match[1].length
    if (start > last)
      nodes.push({ type: "text", value: value.slice(last, start) })
    nodes.push(tag(match[2]))
    last = start + match[2].length + 1
  }
  if (last < value.length)
    nodes.push({ type: "text", value: value.slice(last) })
  return nodes
}

function transform(node: MdastNode) {
  if (!node.children) return
  const out: MdastNode[] = []
  for (const child of node.children) {
    if (child.type === "text" && child.value && TAG_RE.test(child.value)) {
      // `test` on a /g regex advances lastIndex; reset so the split sees the
      // whole value.
      TAG_RE.lastIndex = 0
      out.push(...splitText(child.value))
    } else {
      transform(child)
      out.push(child)
    }
  }
  node.children = out
}

/**
 * Renders `#tag` as a tag chip
 */
export function remarkTags() {
  return (tree: MdastNode) => transform(tree)
}
