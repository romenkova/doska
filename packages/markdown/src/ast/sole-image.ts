import { parseMarkdown, type MdNode } from "./parse"
import { imageSource, type ImageSource } from "./url"

export interface SoleImage {
  source: ImageSource
  alt: string
}

function isBlank(node: MdNode): boolean {
  return node.type === "text" && !(node.value ?? "").trim()
}

/**
 * The image a body consists of, when there is only image
 */
export function soleImage(markdown: string): SoleImage | null {
  if (!markdown.includes("![")) return null
  const blocks = parseMarkdown(markdown).children as MdNode[]
  if (blocks.length !== 1) return null

  const [block] = blocks
  if (block.type !== "paragraph") return null

  const inline = (block.children ?? []).filter((node) => !isBlank(node))
  if (inline.length !== 1) return null

  const [image] = inline
  if (image.type !== "image") return null

  return { source: imageSource(image.url), alt: image.alt ?? "" }
}
