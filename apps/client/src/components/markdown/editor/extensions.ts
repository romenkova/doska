import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { Compartment, EditorState, type Extension } from "@codemirror/state"
import { EditorView, keymap, placeholder } from "@codemirror/view"
import type { RefObject } from "react"
import {
  DEFAULT_SLASH_COMMANDS,
  type SlashCommand,
  type WikilinkOption,
} from "@doska/markdown"
import { completions, slashCompletion, wikilinkCompletion } from "./completions"
import { decorations, wikilinkTargets } from "./decorations"
import { markdownSyntax } from "./language"
import { pasteFiles } from "./paste-files"
import { theme } from "./theme"

export interface EditorOptions {
  value: string
  onChangeValue: (value: string) => void
  autoFocus?: boolean
  placeholder?: string
  /** Off for a plain field as the title. */
  markdown?: boolean
  slashMenu?: boolean
  slashCommands?: SlashCommand[]
  wikilinks?: WikilinkOption[]
  onPasteFiles?: (files: File[]) => Promise<string | null>
}

const BRACKETS = ["(", "[", "{", "`"]

export function editorExtensions(
  live: RefObject<EditorOptions>,
  targets: Compartment
): Extension {
  const {
    markdown,
    slashMenu,
    wikilinks,
    placeholder: placeholderText,
  } = live.current

  const sources = []
  if (slashMenu)
    sources.push(
      slashCompletion(
        () => live.current.slashCommands ?? DEFAULT_SLASH_COMMANDS
      )
    )
  if (wikilinks)
    sources.push(wikilinkCompletion(() => live.current.wikilinks ?? []))

  const markdownExtensions: Extension = markdown
    ? [
        markdownSyntax(),
        decorations(),
        targets.of(wikilinkTargets.of(new Set())),
        closeBrackets(),
        keymap.of(closeBracketsKeymap),
        EditorState.languageData.of(() => [
          { closeBrackets: { brackets: BRACKETS } },
        ]),
        sources.length > 0 ? completions(sources) : [],
        pasteFiles((files) =>
          live.current.onPasteFiles
            ? live.current.onPasteFiles(files)
            : Promise.resolve(null)
        ),
      ]
    : []

  return [
    history(),
    markdownExtensions,
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    theme,
    placeholder(placeholderText ?? ""),
    EditorView.contentAttributes.of({
      "aria-label": placeholderText ?? "",
      autocorrect: "off",
      autocapitalize: "off",
      spellcheck: "false",
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged)
        live.current.onChangeValue(update.state.doc.toString())
    }),
  ]
}
