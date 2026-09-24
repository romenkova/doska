import { cardDisplayId } from "@doska/contract/card-id"
import { useBoard } from "@doska/core/queries"
import { useTagOptions } from "@doska/core/tag-options"
import type { Attachment } from "@doska/core/types"
import Constants from "expo-constants"
import { router } from "expo-router"
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react"
import { WebView } from "react-native-webview"
import type {
  CardRef,
  FromWebview,
  ToWebview,
  WebviewState,
} from "webview/bridge"
import html from "webview/html"
import { ROUTES } from "@/lib/routes"
import { useTheme } from "@/lib/theme"
import { useAttachmentImages } from "./use-attachment-images"

export interface CardBodyWebviewHandle {
  insert: (snippet: string) => void
}

// Opt-in: the Vite dev server serves modules unbundled, slow to open every sheet.
const devHost =
  __DEV__ && process.env.EXPO_PUBLIC_WEBVIEW_DEV === "1"
    ? Constants.expoConfig?.hostUri?.split(":")[0]
    : null

interface IProps {
  ref: Ref<CardBodyWebviewHandle>
  cardId: string
  deckId: string
  body: string
  attachments: Attachment[]
  isPreview: boolean
  onChangeBody: (value: string) => void
  onEdit: () => void
  /** Caret bottom, from the top of the webview. */
  onCaret: (bottom: number) => void
}

function useCardRefs(deckId: string, cardId: string): CardRef[] {
  const { data: board } = useBoard(deckId)

  return useMemo(() => {
    const columns = new Map(board?.columns.map((c) => [c.id, c]))
    return (board?.cards ?? []).flatMap((card) => {
      const target = cardDisplayId(card.number)
      const column = columns.get(card.columnId)
      if (!target || card.id === cardId) return []
      return [
        {
          id: card.id,
          target,
          title: card.title,
          column: column?.title ?? "",
          color: column?.color ?? "",
          done: column?.done ?? false,
        },
      ]
    })
  }, [board, cardId])
}

export function CardBodyWebview({
  ref,
  cardId,
  deckId,
  body,
  attachments,
  isPreview,
  onChangeBody,
  onEdit,
  onCaret,
}: IProps) {
  const webview = useRef<WebView>(null)
  const { theme } = useTheme()
  const tags = useTagOptions(deckId, cardId)
  const refs = useCardRefs(deckId, cardId)
  const images = useAttachmentImages(cardId, attachments)
  const [isReady, setReady] = useState(false)
  const [isFocused, setFocused] = useState(false)
  const [height, setHeight] = useState(0)
  const [isBundled, setBundled] = useState(!devHost)
  // The body the page holds right now.
  const shown = useRef(body)

  const send = (message: ToWebview) => {
    webview.current?.injectJavaScript(
      `window.receive?.(${JSON.stringify(message)});true;`
    )
  }

  useImperativeHandle(ref, () => ({
    insert: (snippet) => send({ type: "insert", snippet }),
  }))

  const state: WebviewState = useMemo(
    () => ({ isPreview, isDark: theme === "dark", tags, refs, images }),
    [isPreview, theme, tags, refs, images]
  )

  useEffect(() => {
    if (isReady) send({ type: "state", state })
  }, [isReady, state])

  // Remote edits only. Mid-typing, or right after on blur, `body` can still be
  // a save behind the page, and sending it would eat the newer text.
  useEffect(() => {
    if (!isReady || isFocused || body === shown.current) return
    shown.current = body
    send({ type: "body", body })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, body])

  const onMessage = (data: string) => {
    const message = JSON.parse(data) as FromWebview
    switch (message.type) {
      case "ready":
        setReady(true)
        send({ type: "state", state })
        send({ type: "body", body: shown.current })
        break
      case "body":
        shown.current = message.body
        onChangeBody(message.body)
        break
      case "openRef":
        router.push(ROUTES.card(message.id))
        break
      case "edit":
        onEdit()
        break
      case "focus":
        setFocused(message.isFocused)
        break
      case "caret":
        onCaret(message.bottom)
        break
      case "height":
        setHeight(message.height)
        break
    }
  }

  return (
    <WebView
      ref={webview}
      source={isBundled ? { html } : { uri: `http://${devHost}:5174` }}
      originWhitelist={["*"]}
      onMessage={(e) => onMessage(e.nativeEvent.data)}
      onError={() => setBundled(true)}
      scrollEnabled={false}
      hideKeyboardAccessoryView
      keyboardDisplayRequiresUserAction={false}
      style={{
        height,
        opacity: isReady ? 1 : 0,
        backgroundColor: "transparent",
      }}
    />
  )
}
