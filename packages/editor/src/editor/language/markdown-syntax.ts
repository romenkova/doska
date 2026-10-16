import {
  insertNewlineContinueMarkupCommand,
  markdown,
  markdownLanguage,
} from "@codemirror/lang-markdown"
import { syntaxHighlighting } from "@codemirror/language"
import { type Extension, Prec } from "@codemirror/state"
import { keymap } from "@codemirror/view"
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
      addKeymap: false,
    }),
    Prec.high(
      keymap.of([
        {
          key: "Enter",
          run: insertNewlineContinueMarkupCommand({ nonTightLists: false }),
        },
      ])
    ),
    syntaxHighlighting(highlightStyle),
  ]
}
