// Sentinel emitted by the cut marker's previewRender. Rendered as a full-width
// dashed divider, wherever it appears in the body.
export const CUT_TOKEN = "-cut-visible-"

interface MdastNode {
  type: string
  value?: string
  children?: MdastNode[]
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

function divider(): MdastNode {
  return {
    type: "emphasis",
    data: { hName: "span", hProperties: { className: ["cut-divider"] } },
    children: [],
  }
}

// Splits a text value on the sentinel, returning text nodes interleaved with
// divider nodes. Newlines adjacent to a divider are trimmed so it sits on its
// own line without shifting the surrounding content.
function splitText(value: string): MdastNode[] {
  const segments = value.split(CUT_TOKEN)
  const nodes: MdastNode[] = []
  segments.forEach((segment, i) => {
    if (i > 0) nodes.push(divider())
    let text = segment
    if (i > 0) text = text.replace(/^[ \t]*\n?/, "")
    if (i < segments.length - 1) text = text.replace(/\n?[ \t]*$/, "")
    if (text) nodes.push({ type: "text", value: text })
  })
  return nodes
}

function transform(node: MdastNode) {
  if (!node.children) return
  const out: MdastNode[] = []
  for (const child of node.children) {
    if (
      child.type === "text" &&
      child.value &&
      child.value.includes(CUT_TOKEN)
    ) {
      out.push(...splitText(child.value))
    } else {
      transform(child)
      out.push(child)
    }
  }
  node.children = out
}

/**
 * Replaces the `-cut-visible-` sentinel with a full-width dashed divider. Used
 * only in the full preview, where the cut marker stays visible instead of
 * truncating the body.
 */
export function remarkCut() {
  return (tree: MdastNode) => transform(tree)
}
