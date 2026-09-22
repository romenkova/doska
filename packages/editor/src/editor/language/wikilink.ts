import { tags as t } from "@lezer/highlight"
import type { MarkdownExtension } from "@lezer/markdown"

const WIKILINK = /^\[\[([^[\]\n|]+)(?:\|([^[\]\n]*))?\]\]/

/**
 * `[[target]]` and `[[target|alias]]`
 */
export const wikilink: MarkdownExtension = {
  defineNodes: [
    "Wikilink",
    "WikilinkTarget",
    "WikilinkAlias",
    { name: "WikilinkMark", style: t.processingInstruction },
  ],
  parseInline: [
    {
      name: "Wikilink",
      parse(cx, next, pos) {
        if (next !== 91 || cx.char(pos + 1) !== 91) return -1
        const match = WIKILINK.exec(cx.slice(pos, cx.end))
        if (!match) return -1
        const [whole, target, alias] = match
        const end = pos + whole.length
        const targetFrom = pos + 2
        const targetTo = targetFrom + target.length
        const children = [
          cx.elt("WikilinkMark", pos, targetFrom),
          cx.elt("WikilinkTarget", targetFrom, targetTo),
        ]
        if (alias !== undefined) {
          const aliasFrom = targetTo + 1
          children.push(
            cx.elt("WikilinkMark", targetTo, aliasFrom),
            cx.elt("WikilinkAlias", aliasFrom, aliasFrom + alias.length)
          )
        }
        children.push(cx.elt("WikilinkMark", end - 2, end))
        return cx.addElement(cx.elt("Wikilink", pos, end, children))
      },
      before: "Link",
    },
  ],
}
