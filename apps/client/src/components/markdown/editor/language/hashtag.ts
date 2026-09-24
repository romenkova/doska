import { PREFIXED_NAME } from "@doska/markdown"
import { Tag } from "@lezer/highlight"
import type { MarkdownExtension } from "@lezer/markdown"

export const hashtagTag = Tag.define()

const HASHTAG = new RegExp(`^#${PREFIXED_NAME}`, "u")

export const hashtag: MarkdownExtension = {
  defineNodes: [{ name: "Hashtag", style: hashtagTag }],
  parseInline: [
    {
      name: "Hashtag",
      parse(cx, next, pos) {
        if (next !== 35) return -1
        if (!/\s|^$/.test(cx.slice(pos - 1, pos))) return -1
        const match = HASHTAG.exec(cx.slice(pos, cx.end))
        if (!match) return -1
        return cx.addElement(cx.elt("Hashtag", pos, pos + match[0].length))
      },
    },
  ],
}
