import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { syntaxHighlighting } from "@codemirror/language"
import type { Extension } from "@codemirror/state"
import { hashtag } from "./hashtag"
import { highlightStyle } from "./highlight-style"
import { mark } from "./mark"
import { wikilink } from "./wikilink"

export function markdownSyntax(): Extension {
  return [
    markdown({
      base: markdownLanguage,
      extensions: [mark, wikilink, hashtag],
      completeHTMLTags: false,
    }),
    syntaxHighlighting(highlightStyle),
  ]
}
