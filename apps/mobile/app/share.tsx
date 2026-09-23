import { SheetScreen } from "@doska/ui-kit-mobile"
import { router } from "expo-router"
import { useShareIntentContext } from "expo-share-intent"
import { useEffect, useEffectEvent, useState } from "react"
import { toShareDraft } from "@/components/share/share-draft"
import { ShareToBoard } from "@/components/share/share-to-board"

export default function ShareSheet() {
  const { shareIntent, resetShareIntent } = useShareIntentContext()
  const [draft] = useState(() => toShareDraft(shareIntent))

  const clearIntent = useEffectEvent(() => {
    resetShareIntent()
  })
  useEffect(() => {
    clearIntent()
  }, [])

  return (
    <SheetScreen>
      <ShareToBoard draft={draft} onDone={() => router.back()} />
    </SheetScreen>
  )
}
