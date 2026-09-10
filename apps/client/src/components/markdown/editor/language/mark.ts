import { Tag, tags as t } from "@lezer/highlight"
import type { MarkdownExtension } from "@lezer/markdown"

export const markTag = Tag.define()

const MarkDelim = { resolve: "Mark", mark: "MarkMark" }

/** `==highlighted==` */
export const mark: MarkdownExtension = {
  defineNodes: [
    { name: "Mark", style: { "Mark/...": markTag } },
    { name: "MarkMark", style: t.processingInstruction },
  ],
  parseInline: [
    {
      name: "Mark",
      parse(cx, next, pos) {
        if (next !== 61 || cx.char(pos + 1) !== 61 || cx.char(pos + 2) === 61)
          return -1
        const before = cx.slice(pos - 1, pos)
        const after = cx.slice(pos + 2, pos + 3)
        const spaceBefore = /\s|^$/.test(before)
        const spaceAfter = /\s|^$/.test(after)
        return cx.addDelimiter(
          MarkDelim,
          pos,
          pos + 2,
          !spaceAfter,
          !spaceBefore
        )
      },
      after: "Emphasis",
    },
  ],
}
