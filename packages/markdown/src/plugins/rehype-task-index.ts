interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

/**
 * Tags each GFM task-list checkbox with its 0-based document-order index (as a
 * `data-task-index` attribute), matching `toggleTaskByIndex`. The index is
 * assigned here, in the unified pipeline, so it's stable: a counter in the
 * React renderer would desync under StrictMode / concurrent double-renders, and
 * the injected checkbox node carries no source position to key off instead.
 */
export function rehypeTaskIndex() {
  return (tree: HastNode) => {
    let index = 0
    const walk = (node: HastNode) => {
      if (node.tagName === "input" && node.properties?.type === "checkbox") {
        node.properties.dataTaskIndex = index++
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
}
