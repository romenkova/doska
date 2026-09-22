import { EditorView } from "@codemirror/view"
import { MarkdownEditor } from "@doska/editor"
import { applyInsert, cut, MarkdownRenderersProvider } from "@doska/markdown"
import { Markdown } from "@doska/ui-kit"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import type { ToWebview, WebviewState } from "./bridge"
import { CardRefLink } from "./card-ref-link"
import { post } from "./native"

const PREVIEW_MARKERS = [cut]

function findView() {
  const editor = document.querySelector<HTMLElement>(".cm-editor")
  return editor ? EditorView.findFromDOM(editor) : null
}

function insert(snippet: string) {
  const view = findView()
  if (!view) return
  const { text, caretOffset } = applyInsert(snippet)
  const { from, to } = view.state.selection.main
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + caretOffset },
    userEvent: "input",
  })
  view.focus()
}

export function App() {
  const [body, setBody] = useState<string | null>(null)
  const [state, setState] = useState<WebviewState | null>(null)

  useEffect(() => {
    window.receive = (message: ToWebview) => {
      if (message.type === "state") setState(message.state)
      else if (message.type === "body") setBody(message.body)
      else insert(message.snippet)
    }
    post({ type: "ready" })
    return () => {
      window.receive = undefined
    }
  }, [])

  const isDark = state?.isDark ?? false
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  useEffect(() => {
    const observer = new ResizeObserver(() =>
      post({ type: "height", height: document.body.offsetHeight })
    )
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frame = 0
    const report = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const view = findView()
        if (!view?.hasFocus) return
        const coords = view.coordsAtPos(view.state.selection.main.head)
        if (coords) post({ type: "caret", bottom: coords.bottom })
      })
    }
    const focus = () =>
      post({ type: "focus", isFocused: Boolean(findView()?.hasFocus) })
    document.addEventListener("selectionchange", report)
    document.addEventListener("input", report)
    document.addEventListener("focusin", focus)
    document.addEventListener("focusout", focus)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("selectionchange", report)
      document.removeEventListener("input", report)
      document.removeEventListener("focusin", focus)
      document.removeEventListener("focusout", focus)
    }
  }, [])

  const refs = state?.refs
  const renderers = useMemo(
    () => ({
      renderWikilink: (target: string, alias?: string) => (
        <CardRefLink target={target} alias={alias} refs={refs ?? []} />
      ),
    }),
    [refs]
  )
  const wikilinks = useMemo(
    () =>
      (refs ?? []).map((ref) => ({
        id: ref.id,
        title: ref.title || "Untitled card",
        hint: `#${ref.target}`,
        target: ref.target,
      })),
    [refs]
  )
  const tags = state?.tags
  const suggestions = useMemo(() => ({ "#": tags ?? [] }), [tags])

  if (body === null || !state) return null

  const change = (value: string) => {
    setBody(value)
    post({ type: "body", body: value })
  }

  if (state.isPreview && !body.trim())
    return (
      <p
        onClick={() => post({ type: "edit" })}
        className="m-0 px-4 py-3 text-muted-foreground"
      >
        Notes
      </p>
    )

  return (
    <MarkdownRenderersProvider value={renderers}>
      <MarkdownEditor
        isPreview={state.isPreview}
        renderPreview={Markdown}
        value={body}
        autoFocus
        onChangeValue={change}
        onToggleTask={change}
        markers={PREVIEW_MARKERS}
        slashMenu
        hideSlashFab
        markdown
        wikilinks={wikilinks}
        suggestions={suggestions}
        placeholder="Notes"
        className="text-[15px]"
        containerClassName="px-4"
      />
    </MarkdownRenderersProvider>
  )
}
