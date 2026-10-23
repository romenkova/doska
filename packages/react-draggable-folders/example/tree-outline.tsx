import type { Node } from "./data"

interface IProps {
  nodes: Node[]
}

/** What `onChange` would hand you to persist. */
export function TreeOutline({ nodes }: IProps) {
  return (
    <pre className="overflow-x-auto font-mono text-xs/5 text-zinc-500">
      {outline(nodes, 0)}
    </pre>
  )
}

function outline(nodes: Node[], depth: number): string {
  const indent = "  ".repeat(depth)
  return nodes
    .map((node) => {
      if (node.type === "item") return `${indent}${node.data.title}\n`
      const inside = outline([...node.folders, ...node.items], depth + 1)
      return `${indent}${node.data.title}/\n${inside}`
    })
    .join("")
}
