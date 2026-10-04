import { TAG_RE } from "../tag"

interface MdastNode {
  type: string
  value?: string
  children?: MdastNode[]
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

function tag(prefix: string, name: string): MdastNode {
  const hProperties =
    prefix === "@"
      ? { className: ["user"], dataUser: name }
      : { className: ["tag"], dataTag: name }
  return {
    type: "emphasis",
    data: { hName: "span", hProperties },
    children: [{ type: "text", value: `${prefix}${name}` }],
  }
}

// Splits a text value on `#tag` and `@user`, returning text nodes interleaved with tag nodes.
function splitText(value: string): MdastNode[] {
  const nodes: MdastNode[] = []
  let last = 0
  for (const match of value.matchAll(TAG_RE)) {
    const start = (match.index ?? 0) + match[1].length
    if (start > last)
      nodes.push({ type: "text", value: value.slice(last, start) })
    nodes.push(tag(match[2], match[3]))
    last = start + match[2].length + match[3].length
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
 * Renders `#tag` and `@user` as chips
 */
export function remarkTags() {
  return (tree: MdastNode) => transform(tree)
}
