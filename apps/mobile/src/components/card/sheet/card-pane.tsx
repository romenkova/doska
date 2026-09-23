import { DEFAULT_SLASH_COMMANDS, type SlashCommand } from "@doska/markdown"
import type { Card } from "@doska/core/types"
import { useCardDeckId } from "@doska/core/queries"
import { TextField } from "@doska/ui-kit-mobile"
import { useEffect, useRef, useState } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useKeyboardHeight } from "@/lib/use-keyboard-height"
import {
  CardBodyWebview,
  type CardBodyWebviewHandle,
} from "./card-body-webview"
import { CardPaneHeader } from "./card-pane-header"
import { EditorToolbar, TOOLBAR_HEIGHT } from "./editor-toolbar"

/** Backs the inputs only: round-tripping each keystroke would lag the caret. */
export type Draft = Partial<Pick<Card, "title" | "body">>

interface IProps {
  cardId: string
  content: Card
  onQueue: (id: string, patch: Draft) => void
}

/** One card's editing session. Mount it keyed by `cardId`. */
export function CardPane({ cardId, content, onQueue }: IProps) {
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const { data: deckId } = useCardDeckId(cardId)

  const [draft, setDraft] = useState<Draft>({})
  // Decided at mount, never re-derived: once you type, `content.body` is no
  // longer evidence the card opened with notes.
  const [isPreview, setPreview] = useState(() => Boolean(content.body.trim()))

  const title = draft.title ?? content.title
  const body = draft.body ?? content.body

  const edit = (patch: Draft) => {
    setDraft((d) => ({ ...d, ...patch }))
    onQueue(cardId, patch)
  }

  const webview = useRef<CardBodyWebviewHandle>(null)
  const webviewTop = useRef(0)
  const scrollY = useRef(0)
  const viewportHeight = useRef(0)
  const [caretBottom, setCaretBottom] = useState<number | null>(null)
  const scroller = useRef<ScrollView>(null)

  const toolbar = {
    items: DEFAULT_SLASH_COMMANDS,
    isPreview,
    onPreview: () => setPreview(true),
    onSelect: (command: SlashCommand) =>
      webview.current?.insert(command.insert),
  }

  // Everything the bar covers: its own height, a gap, and the keyboard or the
  // home indicator underneath it. The pane itself carries no padding — an
  // absolute child is laid out against the border box, so padding here would
  // fail to lift the bar.
  const bottomInset = keyboard || insets.bottom

  // The webview is sized to its content, so only native scrolling can bring
  // its caret out from under the keyboard.
  const revealCaret = () => {
    if (caretBottom === null) return
    const visible = viewportHeight.current - (TOOLBAR_HEIGHT + 16 + bottomInset)
    const overflow =
      webviewTop.current + caretBottom - (scrollY.current + visible)
    if (overflow > 0) {
      scroller.current?.scrollTo({
        y: scrollY.current + overflow,
        animated: true,
      })
    }
  }

  useEffect(revealCaret, [caretBottom, bottomInset])

  return (
    <View collapsable={false} className="flex-1 bg-card">
      <ScrollView
        ref={scroller}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y
        }}
        onLayout={(e) => {
          viewportHeight.current = e.nativeEvent.layout.height
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: TOOLBAR_HEIGHT + 16 + bottomInset,
        }}
        onContentSizeChange={revealCaret}
      >
        <CardPaneHeader
          cardId={cardId}
          body={body}
          deadline={content.deadline}
          priority={content.priority}
        />
        <TextField
          multiline
          value={title}
          onChangeText={(value) => edit({ title: value })}
          placeholder="Title"
          className={
            isPreview
              ? "px-4 py-1.5 text-xl font-sans-semibold text-card-foreground"
              : "px-4 py-1.5 font-mono text-xl text-card-foreground"
          }
        />
        <View
          onLayout={(e) => {
            webviewTop.current = e.nativeEvent.layout.y
          }}
        >
          <CardBodyWebview
            ref={webview}
            cardId={cardId}
            deckId={deckId ?? ""}
            body={content.body}
            isPreview={isPreview}
            onChangeBody={(value) => edit({ body: value })}
            onEdit={() => setPreview(false)}
            onCaret={setCaretBottom}
          />
        </View>
      </ScrollView>

      {/* Floats over the note, so the blur has something to blur.
          `InputAccessoryView` would be the native way to ride the keyboard, but
          it does not render inside a `formSheet` — the bar simply vanished
          whenever the keyboard opened. */}
      <View className="absolute inset-x-0" style={{ bottom: bottomInset }}>
        <EditorToolbar {...toolbar} />
      </View>
    </View>
  )
}
